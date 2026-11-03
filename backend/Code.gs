/**
 * ============================================================
 * Nodo Academy · Backend en Google Apps Script (Sprint 4)
 * ------------------------------------------------------------
 * Qué hace:
 *  1. crearPago   → crea el cobro en la pasarela (Mercado Pago, Checkout Pro)
 *                   y devuelve el enlace de pago.
 *  2. Webhook     → recibe el aviso de la pasarela, CONSULTA el pago por su ID
 *                   y, solo si está aprobado, crea payments + enrollments en
 *                   Firestore y pasa el lead a "cliente".
 *  3. nuevoLead   → envía el correo de bienvenida (S4-10).
 *
 * Configuración (Apps Script → ⚙ Configuración del proyecto → Propiedades del script):
 *   PASARELA_TOKEN     = Access Token de PRUEBA de Mercado Pago (nunca en el código ni en GitHub)
 *   FIREBASE_PROJECT   = id del proyecto de Firebase (ej. nodo-academy-xxxx)
 *   SITIO_URL          = https://usuario.github.io/lms-nodo-academy/
 *
 * Para que el script escriba en Firestore: ⚙ Configuración del proyecto →
 * "Proyecto de Google Cloud Platform" → poner el número del proyecto de Firebase.
 * Así ScriptApp.getOAuthToken() tiene permiso de la cuenta dueña del proyecto
 * (ver appsscript.json: scopes "datastore").
 *
 * Publicar: Implementar → Nueva implementación → Aplicación web →
 *   Ejecutar como: Yo · Acceso: Cualquier usuario → copiar la URL /exec
 *   en js/firebase-config.js (APPS_SCRIPT_URL) y en el panel de la pasarela (webhook).
 * ============================================================
 */

const PROPS = PropertiesService.getScriptProperties();
const cfg = (k) => PROPS.getProperty(k) || "";

/* ---------- Punto de entrada: el frontend envía POST con Content-Type text/plain ---------- */
function doPost(e) {
  try {
    const cuerpo = JSON.parse(e.postData.contents || "{}");
    const params = e.parameter || {};

    // Aviso (webhook) de Mercado Pago: viene como ?type=payment&data.id=123 o en el cuerpo
    if (params.type === "payment" || cuerpo.type === "payment" || cuerpo.action === "payment.updated" || cuerpo.action === "payment.created") {
      const pagoId = params["data.id"] || (cuerpo.data && cuerpo.data.id) || params.id;
      return responder(procesarAvisoDePago(pagoId));
    }

    switch (cuerpo.accion) {
      case "crearPago": return responder(crearPago(cuerpo));
      case "nuevoLead": return responder(enviarBienvenida(cuerpo));
      default: return responder({ ok: false, error: "Acción desconocida" });
    }
  } catch (err) {
    console.error(err);
    return responder({ ok: false, error: String(err) });
  }
}

/* Mercado Pago a veces hace GET para validar la URL; también sirve para probar en el navegador */
function doGet(e) {
  const p = e.parameter || {};
  if (p.type === "payment" && p["data.id"]) return responder(procesarAvisoDePago(p["data.id"]));
  return responder({ ok: true, servicio: "Nodo Academy backend", hora: new Date().toISOString() });
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
   1. CREAR PAGO (Checkout Pro de Mercado Pago)
   ============================================================ */
function crearPago(d) {
  if (!d.userId || !d.courseId) return { ok: false, error: "Faltan userId o courseId" };
  const curso = fsLeer("courses", d.courseId);
  if (!curso || curso.published !== true) return { ok: false, error: "Curso no disponible" };

  const sitio = cfg("SITIO_URL") || d.origen;
  const referencia = d.userId + "|" + d.courseId; // external_reference: usuario + curso
  const preferencia = {
    items: [{ id: d.courseId, title: curso.title, quantity: 1, unit_price: Number(curso.price), currency_id: "COP", description: "Curso en línea · Nodo Academy" }],
    payer: { email: d.email || "" },
    external_reference: referencia,
    back_urls: {
      success: sitio + "pago.html?estado=exito&curso=" + encodeURIComponent(d.courseId),
      pending: sitio + "pago.html?estado=pendiente&curso=" + encodeURIComponent(d.courseId),
      failure: sitio + "pago.html?estado=rechazado&curso=" + encodeURIComponent(d.courseId)
    },
    auto_return: "approved",
    notification_url: ScriptApp.getService().getUrl(),
    statement_descriptor: "NODO ACADEMY"
  };
  const resp = UrlFetchApp.fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "post", contentType: "application/json",
    headers: { Authorization: "Bearer " + cfg("PASARELA_TOKEN") },
    payload: JSON.stringify(preferencia), muteHttpExceptions: true
  });
  const datos = JSON.parse(resp.getContentText());
  if (resp.getResponseCode() >= 300) return { ok: false, error: "Pasarela: " + (datos.message || resp.getContentText()) };
  // En pruebas se usa sandbox_init_point; en producción init_point
  return { ok: true, url: datos.sandbox_init_point || datos.init_point, preferenciaId: datos.id };
}

/* ============================================================
   2. WEBHOOK: verificar el pago y crear la inscripción
   Nunca confiamos solo en el aviso: consultamos el pago a la pasarela.
   ============================================================ */
function procesarAvisoDePago(pagoId) {
  if (!pagoId) return { ok: false, error: "Sin id de pago" };
  const resp = UrlFetchApp.fetch("https://api.mercadopago.com/v1/payments/" + pagoId, {
    headers: { Authorization: "Bearer " + cfg("PASARELA_TOKEN") }, muteHttpExceptions: true
  });
  if (resp.getResponseCode() >= 300) return { ok: false, error: "No se pudo consultar el pago " + pagoId };
  const pago = JSON.parse(resp.getContentText());
  const [userId, courseId] = String(pago.external_reference || "").split("|");
  if (!userId || !courseId) return { ok: false, error: "Referencia inválida" };

  // Registro del pago (id predecible = id de la pasarela → no se duplica)
  fsEscribir("payments", String(pago.id), {
    paymentId: String(pago.id), status: pago.status, amount: Number(pago.transaction_amount),
    userId: userId, courseId: courseId, date: new Date().toISOString(), payerEmail: (pago.payer && pago.payer.email) || ""
  });

  if (pago.status !== "approved") return { ok: true, estado: pago.status, inscrito: false };

  // Inscripción con id predecible usuario_curso (si llega dos veces el aviso, no se duplica)
  fsEscribir("enrollments", userId + "_" + courseId, {
    userId: userId, courseId: courseId, status: "active", paymentId: String(pago.id),
    amount: Number(pago.transaction_amount), createdAt: new Date().toISOString()
  });
  // CRM: el contacto pasa a "cliente" (S4-06)
  pasarLeadACliente(userId, (pago.payer && pago.payer.email) || "");
  return { ok: true, estado: "approved", inscrito: true };
}

function pasarLeadACliente(userId, correo) {
  const usuario = fsLeer("users", userId);
  const email = ((usuario && usuario.email) || correo || "").toLowerCase();
  const porUsuario = fsConsultar("leads", "userId", userId);
  const porCorreo = email ? fsConsultar("leads", "email", email) : [];
  const vistos = {};
  porUsuario.concat(porCorreo).forEach(function (l) {
    if (vistos[l.id]) return; vistos[l.id] = true;
    fsActualizar("leads", l.id, { stage: "cliente", userId: userId });
  });
  if (!Object.keys(vistos).length && email) {
    // No había lead: lo creamos como cliente para que el CRM tenga el historial completo
    fsEscribir("leads", "auto_" + userId, { name: (usuario && usuario.name) || email, email: email, stage: "cliente", source: "compra-directa", consent: true, userId: userId, createdAt: new Date().toISOString() });
  }
}

/* ============================================================
   3. CORREO DE BIENVENIDA (S4-10)
   ============================================================ */
function enviarBienvenida(d) {
  if (!d.email) return { ok: false, error: "Sin correo" };
  const nombre = d.name || "";
  MailApp.sendEmail({
    to: d.email,
    subject: "¡Bienvenido/a a Nodo Academy! 🎓",
    htmlBody:
      "<p>Hola " + nombre + ",</p>" +
      "<p>Gracias por tu interés en nuestros cursos de tecnología para principiantes. Muy pronto te escribiremos con fechas, precios y descuentos.</p>" +
      "<p>Mientras tanto, mira el catálogo: <a href=\"" + cfg("SITIO_URL") + "cursos.html\">" + cfg("SITIO_URL") + "cursos.html</a></p>" +
      "<p>— Equipo Nodo Academy</p>"
  });
  return { ok: true };
}

/* ============================================================
   FIRESTORE REST (con el permiso de la cuenta dueña del proyecto)
   ============================================================ */
function fsBase() { return "https://firestore.googleapis.com/v1/projects/" + cfg("FIREBASE_PROJECT") + "/databases/(default)/documents/"; }
function fsHeaders() { return { Authorization: "Bearer " + ScriptApp.getOAuthToken() }; }

function fsLeer(coleccion, id) {
  const r = UrlFetchApp.fetch(fsBase() + coleccion + "/" + encodeURIComponent(id), { headers: fsHeaders(), muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) return null;
  return desdeFirestore(JSON.parse(r.getContentText()).fields);
}
function fsEscribir(coleccion, id, datos) {
  const r = UrlFetchApp.fetch(fsBase() + coleccion + "/" + encodeURIComponent(id), {
    method: "patch", contentType: "application/json", headers: fsHeaders(),
    payload: JSON.stringify({ fields: aFirestore(datos) }), muteHttpExceptions: true
  });
  if (r.getResponseCode() >= 300) throw new Error("Firestore: " + r.getContentText());
}
function fsActualizar(coleccion, id, datos) {
  const mask = Object.keys(datos).map(function (k) { return "updateMask.fieldPaths=" + encodeURIComponent(k); }).join("&");
  const r = UrlFetchApp.fetch(fsBase() + coleccion + "/" + encodeURIComponent(id) + "?" + mask, {
    method: "patch", contentType: "application/json", headers: fsHeaders(),
    payload: JSON.stringify({ fields: aFirestore(datos) }), muteHttpExceptions: true
  });
  if (r.getResponseCode() >= 300) throw new Error("Firestore: " + r.getContentText());
}
function fsConsultar(coleccion, campo, valor) {
  const consulta = { structuredQuery: { from: [{ collectionId: coleccion }], where: { fieldFilter: { field: { fieldPath: campo }, op: "EQUAL", value: aValor(valor) } } } };
  const r = UrlFetchApp.fetch(fsBase() + ":runQuery", { method: "post", contentType: "application/json", headers: fsHeaders(), payload: JSON.stringify(consulta), muteHttpExceptions: true });
  if (r.getResponseCode() >= 300) return [];
  return JSON.parse(r.getContentText()).filter(function (x) { return x.document; }).map(function (x) {
    const d = desdeFirestore(x.document.fields); d.id = x.document.name.split("/").pop(); return d;
  });
}

// Conversión entre JSON normal y el formato de la API REST de Firestore
function aValor(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(aValor) } };
  if (typeof v === "object") return { mapValue: { fields: aFirestore(v) } };
  return { stringValue: String(v) };
}
function aFirestore(obj) { const f = {}; Object.keys(obj).forEach(function (k) { f[k] = aValor(obj[k]); }); return f; }
function deValor(v) {
  if (!v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(deValor);
  if ("mapValue" in v) return desdeFirestore(v.mapValue.fields);
  return null;
}
function desdeFirestore(fields) { const o = {}; Object.keys(fields || {}).forEach(function (k) { o[k] = deValor(fields[k]); }); return o; }

/* ---------- Prueba manual desde el editor: ejecutar y revisar "Registro de ejecución" ---------- */
function probarConexion() {
  console.log("Proyecto:", cfg("FIREBASE_PROJECT"));
  console.log("Cursos publicados de ejemplo:", JSON.stringify(fsLeer("courses", "desarrollo-web-desde-cero")));
}
