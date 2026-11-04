/**
 * ============================================================
 * Nodo Academy · Backend en Google Apps Script (Sprint 4)
 * Pasarela de pago: WOMPI (Colombia) · Web Checkout
 * ------------------------------------------------------------
 * Qué hace:
 *  1. crearPago    → arma el enlace del Web Checkout de Wompi con la
 *                    firma de integridad (se calcula aquí, nunca en el frontend)
 *                    y devuelve la URL a la que se envía al estudiante.
 *  2. Webhook      → recibe el evento transaction.updated de Wompi, verifica el
 *                    checksum con el secreto de eventos, CONSULTA la transacción
 *                    a Wompi por su id y, solo si está APPROVED, crea payments +
 *                    enrollments en Firestore y pasa el lead a "cliente".
 *  3. estadoPago   → cuando el estudiante vuelve del checkout (?id=...), la página
 *                    pago.html pregunta aquí; el script consulta Wompi y procesa el
 *                    pago igual que el webhook (plan B si el webhook falla).
 *  4. nuevoLead    → envía el correo de bienvenida (S4-10).
 *
 * Propiedades del script (⚙ Configuración del proyecto → Propiedades del script):
 *   WOMPI_PUBLIC_KEY       = pub_test_... (sandbox) · pub_prod_... (producción)
 *   WOMPI_PRIVATE_KEY      = prv_test_... · prv_prod_...
 *   WOMPI_INTEGRITY_SECRET = test_integrity_... · prod_integrity_...
 *   WOMPI_EVENTS_SECRET    = test_events_... · prod_events_...
 *   WOMPI_ENV              = sandbox | production
 *   FIREBASE_PROJECT       = nodo-academy-bc8b2
 *   SITIO_URL              = https://henaomike11-ux.github.io/lms-nodo-academy/
 *
 * Para que el script escriba en Firestore: ⚙ Configuración del proyecto →
 * "Proyecto de Google Cloud Platform" → número del proyecto de Firebase (150284357973).
 *
 * Publicar: Implementar → Nueva implementación → Aplicación web →
 *   Ejecutar como: Yo · Acceso: Cualquier usuario → copiar la URL /exec en
 *   js/firebase-config.js (APPS_SCRIPT_URL) y en Wompi → Desarrolladores → URL de eventos.
 * ============================================================
 */

const PROPS = PropertiesService.getScriptProperties();
const cfg = (k) => String(PROPS.getProperty(k) || "").trim(); // trim: evita espacios al pegar llaves
const WOMPI_API = () => (cfg("WOMPI_ENV") === "production" ? "https://production.wompi.co/v1" : "https://sandbox.wompi.co/v1");

/* ---------- Punto de entrada: el frontend y Wompi envían POST ---------- */
function doPost(e) {
  try {
    const cuerpo = JSON.parse((e.postData && e.postData.contents) || "{}");

    // Evento (webhook) de Wompi
    if (cuerpo.event && cuerpo.data && cuerpo.data.transaction) {
      return responder(procesarEventoWompi(cuerpo));
    }
    switch (cuerpo.accion) {
      case "crearPago": return responder(crearPago(cuerpo));
      case "estadoPago": return responder(procesarTransaccion(cuerpo.transactionId));
      case "nuevoLead": return responder(enviarBienvenida(cuerpo));
      default: return responder({ ok: false, error: "Acción desconocida" });
    }
  } catch (err) {
    console.error(err);
    return responder({ ok: false, error: String(err) });
  }
}

/* Para probar en el navegador que la aplicación web responde */
function doGet() {
  return responder({ ok: true, servicio: "Nodo Academy backend", pasarela: "Wompi", entorno: cfg("WOMPI_ENV") || "sandbox", hora: new Date().toISOString() });
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
   1. CREAR PAGO (Web Checkout de Wompi)
   ============================================================ */
function crearPago(d) {
  if (!d.userId || !d.courseId) return { ok: false, error: "Faltan userId o courseId" };
  const curso = fsLeer("courses", d.courseId);
  if (!curso || curso.published !== true) return { ok: false, error: "Curso no disponible" };

  const sitio = cfg("SITIO_URL") || d.origen || "";
  const montoCentavos = Math.round(Number(curso.price) * 100);
  const moneda = "COP";
  // Referencia única y legible: usuario + curso + momento (Wompi exige que no se repita)
  const referencia = d.userId + "__" + d.courseId + "__" + Date.now();
  const firma = sha256(referencia + montoCentavos + moneda + cfg("WOMPI_INTEGRITY_SECRET"));

  // Guardamos el intento de pago para poder relacionar la referencia después
  fsEscribir("payments", referencia, {
    paymentId: referencia, status: "PENDING", amount: Number(curso.price), userId: d.userId, courseId: d.courseId,
    date: new Date().toISOString(), payerEmail: d.email || "", provider: "wompi"
  });

  const params = {
    "public-key": cfg("WOMPI_PUBLIC_KEY"),
    "currency": moneda,
    "amount-in-cents": String(montoCentavos),
    "reference": referencia,
    "signature:integrity": firma,
    "redirect-url": sitio + "pago.html?estado=retorno&curso=" + encodeURIComponent(d.courseId),
    "customer-data:email": d.email || ""
  };
  const query = Object.keys(params).filter(k => params[k] !== "").map(k => encodeURIComponent(k) + "=" + encodeURIComponent(params[k])).join("&");
  return { ok: true, url: "https://checkout.wompi.co/p/?" + query, referencia: referencia };
}

/* ============================================================
   2. WEBHOOK: verificar el checksum y procesar la transacción
   ============================================================ */
function procesarEventoWompi(evento) {
  if (evento.event !== "transaction.updated") return { ok: true, ignorado: evento.event };
  // Verificación del checksum (docs.wompi.co → Eventos)
  const props = (evento.signature && evento.signature.properties) || [];
  let cadena = "";
  props.forEach(function (ruta) {
    cadena += String(ruta.split(".").reduce(function (o, k) { return o ? o[k] : ""; }, evento.data));
  });
  cadena += String(evento.timestamp) + cfg("WOMPI_EVENTS_SECRET");
  const esperado = sha256(cadena).toUpperCase();
  const recibido = String((evento.signature && evento.signature.checksum) || "").toUpperCase();
  if (!recibido || esperado !== recibido) {
    console.error("Checksum inválido", { esperado: esperado, recibido: recibido });
    return { ok: false, error: "Checksum inválido" };
  }
  // Nunca confiamos solo en el aviso: consultamos la transacción
  return procesarTransaccion(evento.data.transaction.id);
}

/* Consulta la transacción en Wompi y, si está aprobada, crea la inscripción */
function procesarTransaccion(transactionId) {
  if (!transactionId) return { ok: false, error: "Sin id de transacción" };
  const resp = UrlFetchApp.fetch(WOMPI_API() + "/transactions/" + encodeURIComponent(transactionId), {
    headers: { Authorization: "Bearer " + cfg("WOMPI_PRIVATE_KEY") }, muteHttpExceptions: true
  });
  if (resp.getResponseCode() >= 300) return { ok: false, error: "No se pudo consultar la transacción " + transactionId + ": " + resp.getContentText() };
  const tx = JSON.parse(resp.getContentText()).data;
  const partes = String(tx.reference || "").split("__");
  const userId = partes[0], courseId = partes[1];
  if (!userId || !courseId) return { ok: false, error: "Referencia inválida: " + tx.reference };

  // Actualizamos el registro del pago (id = referencia, así no se duplica)
  fsEscribir("payments", tx.reference, {
    paymentId: tx.reference, transactionId: tx.id, status: tx.status, amount: Number(tx.amount_in_cents) / 100,
    userId: userId, courseId: courseId, date: new Date().toISOString(), payerEmail: tx.customer_email || "",
    paymentMethod: tx.payment_method_type || "", provider: "wompi"
  });

  if (tx.status !== "APPROVED") return { ok: true, estado: tx.status, inscrito: false };

  // Inscripción con id predecible usuario_curso (si el evento llega dos veces, no se duplica)
  fsEscribir("enrollments", userId + "_" + courseId, {
    userId: userId, courseId: courseId, status: "active", paymentId: tx.reference,
    amount: Number(tx.amount_in_cents) / 100, createdAt: new Date().toISOString()
  });
  pasarLeadACliente(userId, tx.customer_email || ""); // CRM: contacto → cliente (S4-06)
  return { ok: true, estado: "APPROVED", inscrito: true };
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
    fsEscribir("leads", "auto_" + userId, { name: (usuario && usuario.name) || email, email: email, stage: "cliente", source: "compra-directa", consent: true, userId: userId, createdAt: new Date().toISOString() });
  }
}

/* ============================================================
   3. CORREO DE BIENVENIDA (S4-10)
   ============================================================ */
function enviarBienvenida(d) {
  if (!d.email) return { ok: false, error: "Sin correo" };
  MailApp.sendEmail({
    to: d.email,
    subject: "¡Bienvenido/a a Nodo Academy! 🎓",
    htmlBody:
      "<p>Hola " + (d.name || "") + ",</p>" +
      "<p>Gracias por tu interés en nuestros cursos de tecnología para principiantes. Muy pronto te escribiremos con fechas, precios y descuentos.</p>" +
      "<p>Mientras tanto, mira el catálogo: <a href=\"" + cfg("SITIO_URL") + "cursos.html\">" + cfg("SITIO_URL") + "cursos.html</a></p>" +
      "<p>¿Dudas? Escríbenos por WhatsApp al +57 314 688 2183 o a henaomike11@gmail.com.</p>" +
      "<p>— Equipo Nodo Academy</p>"
  });
  return { ok: true };
}

/* ============================================================
   UTILIDADES
   ============================================================ */
function sha256(texto) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, texto, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ("0" + ((b + 256) % 256).toString(16)).slice(-2); }).join("");
}

/* ---------- Firestore REST (con el permiso de la cuenta dueña del proyecto) ---------- */
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

/* ---------- Diagnóstico de llaves: muestra prefijo y longitud, nunca el valor ---------- */
function diagnosticarLlaves() {
  const esperado = { WOMPI_PUBLIC_KEY: "pub_", WOMPI_PRIVATE_KEY: "prv_", WOMPI_INTEGRITY_SECRET: "integrity_", WOMPI_EVENTS_SECRET: "events_" };
  Object.keys(esperado).forEach(function (k) {
    const crudo = String(PROPS.getProperty(k) || "");
    const v = crudo.trim();
    const entorno = v.indexOf("test") >= 0 ? "sandbox" : (v.indexOf("prod") >= 0 ? "PRODUCCIÓN" : "?");
    console.log(k + ": " + (v ? "ok" : "VACÍA") + " · prefijo " + v.slice(0, 15) + "… · longitud " + v.length +
      (crudo !== v ? " · ¡tenía espacios, se recortan automáticamente!" : "") +
      (v && v.indexOf(esperado[k]) < 0 ? " · ¡NO parece una llave de tipo " + esperado[k] + "!" : "") + " · " + entorno);
  });
  // Firma de ejemplo para comparar con la documentación de Wompi
  const ejemplo = sha256("sk8-438k4-xmxfx-5213" + "2490000" + "COP" + "prod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6");
  console.log("Prueba de SHA256 (debe ser 06d3e5454ea70a59bd0438fda25a370b5e697d9da051b6835e4b0328a9b56324): " + ejemplo);
}

/* ---------- Prueba manual desde el editor (ejecutar y revisar el registro) ---------- */
function probarConexion() {
  console.log("Proyecto Firebase:", cfg("FIREBASE_PROJECT"), "· Wompi:", cfg("WOMPI_ENV") || "sandbox", "· llave pública:", cfg("WOMPI_PUBLIC_KEY") ? "configurada" : "FALTA");
  console.log("Curso de prueba:", JSON.stringify(fsLeer("courses", "desarrollo-web-desde-cero")));
}
