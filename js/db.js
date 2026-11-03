/* ============================================================
   Nodo Academy · db.js — capa de datos
   ------------------------------------------------------------
   Todas las páginas piden los datos a este archivo. Si
   js/firebase-config.js tiene un proyecto configurado, lee y
   escribe en Firebase (Authentication + Firestore). Si no,
   funciona en modo demo con js/datos.js (Sprint 1).

   Colecciones (sección 8 de la guía):
   users, courses, lessons, enrollments, progress, payments,
   leads, interactions, instructors, resources
   ============================================================ */

const CFG = window.FIREBASE_CONFIG || {};
export const usaFirebase = Boolean(CFG.apiKey && CFG.projectId);

const VERSION_SDK = "10.14.1";
const cdn = (m) => `https://www.gstatic.com/firebasejs/${VERSION_SDK}/firebase-${m}.js`;

let fb = null;
async function firebase() {
  if (!usaFirebase) return null;
  if (fb) return fb;
  const [app, auth, fs] = await Promise.all([import(cdn("app")), import(cdn("auth")), import(cdn("firestore"))]);
  const instancia = app.initializeApp(CFG);
  fb = { auth: auth.getAuth(instancia), db: fs.getFirestore(instancia), A: auth, F: fs };
  return fb;
}

/* ============================================================
   AUTENTICACIÓN
   ============================================================ */
let usuarioActual = null;
const oyentes = new Set();

/** Llama a cb(usuario|null) ahora y cada vez que cambie la sesión. usuario = {uid, email, name, role} */
export function onUser(cb) {
  oyentes.add(cb);
  if (!usaFirebase) { cb(null); return; }
  firebase().then(({ auth, A }) => {
    if (oyentes.size === 1 || !usuarioActual) {
      A.onAuthStateChanged(auth, async (u) => {
        usuarioActual = u ? await obtenerPerfil(u) : null;
        oyentes.forEach(fn => fn(usuarioActual));
      });
    } else cb(usuarioActual);
  });
}

async function obtenerPerfil(u) {
  const { db, F } = await firebase();
  const ref = F.doc(db, "users", u.uid);
  let snap = await F.getDoc(ref);
  if (!snap.exists()) {
    const datos = { name: u.displayName || u.email.split("@")[0], email: u.email, role: "student", createdAt: F.serverTimestamp() };
    await F.setDoc(ref, datos);
    snap = await F.getDoc(ref);
  }
  return { uid: u.uid, ...snap.data() };
}

export async function registrar(nombre, correo, clave) {
  const { auth, db, A, F } = await firebase();
  const cred = await A.createUserWithEmailAndPassword(auth, correo, clave);
  await A.updateProfile(cred.user, { displayName: nombre });
  await F.setDoc(F.doc(db, "users", cred.user.uid), { name: nombre, email: correo, role: "student", createdAt: F.serverTimestamp() });
  await vincularLead(correo, cred.user.uid);
  return cred.user;
}
export async function entrar(correo, clave) {
  const { auth, A } = await firebase();
  return (await A.signInWithEmailAndPassword(auth, correo, clave)).user;
}
export async function entrarConGoogle() {
  const { auth, A } = await firebase();
  const cred = await A.signInWithPopup(auth, new A.GoogleAuthProvider());
  await vincularLead(cred.user.email, cred.user.uid);
  return cred.user;
}
export async function recuperarClave(correo) {
  const { auth, A } = await firebase();
  await A.sendPasswordResetEmail(auth, correo);
}
export async function logout() {
  if (!usaFirebase) return;
  const { auth, A } = await firebase();
  await A.signOut(auth);
}

/* ============================================================
   CURSOS, LECCIONES E INSTRUCTORES
   ============================================================ */
export async function obtenerCursos({ todos = false } = {}) {
  if (!usaFirebase) return DATOS.courses.filter(c => todos || c.published);
  const { db, F } = await firebase();
  const q = todos ? F.collection(db, "courses") : F.query(F.collection(db, "courses"), F.where("published", "==", true));
  const snap = await F.getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function obtenerCurso(id) {
  if (!usaFirebase) return DATOS.courses.find(c => c.id === id) || null;
  const { db, F } = await firebase();
  const snap = await F.getDoc(F.doc(db, "courses", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
export async function guardarCurso(id, datos) {
  const { db, F } = await firebase();
  await F.setDoc(F.doc(db, "courses", id), { ...datos, updatedAt: F.serverTimestamp() }, { merge: true });
}
export async function obtenerLecciones(courseId) {
  let lista;
  if (!usaFirebase) lista = DATOS.lessons.filter(l => l.courseId === courseId);
  else {
    const { db, F } = await firebase();
    const snap = await F.getDocs(F.query(F.collection(db, "lessons"), F.where("courseId", "==", courseId)));
    lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  return lista.sort((a, b) => a.order - b.order);
}
export async function obtenerLeccion(id) {
  if (!usaFirebase) return DATOS.lessons.find(l => l.id === id) || null;
  const { db, F } = await firebase();
  const snap = await F.getDoc(F.doc(db, "lessons", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
export async function guardarLeccion(id, datos) {
  const { db, F } = await firebase();
  await F.setDoc(F.doc(db, "lessons", id), datos, { merge: true });
}
export async function eliminarLeccion(id) {
  const { db, F } = await firebase();
  await F.deleteDoc(F.doc(db, "lessons", id));
}
export async function obtenerInstructores() {
  if (!usaFirebase) return DATOS.instructors;
  const { db, F } = await firebase();
  const snap = await F.getDocs(F.collection(db, "instructors"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function obtenerInstructor(id) {
  if (!id) return null;
  if (!usaFirebase) return DATOS.instructors.find(i => i.id === id) || null;
  const { db, F } = await firebase();
  const snap = await F.getDoc(F.doc(db, "instructors", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
export async function guardarInstructor(id, datos) {
  const { db, F } = await firebase();
  await F.setDoc(F.doc(db, "instructors", id), datos, { merge: true });
}

/* ============================================================
   CRM: LEADS E INTERACCIONES
   ============================================================ */
export async function crearLead(datos) {
  if (!usaFirebase) {
    const guardados = JSON.parse(localStorage.getItem("leads-demo") || "[]");
    guardados.push({ ...datos, stage: "nuevo", createdAt: new Date().toISOString() });
    localStorage.setItem("leads-demo", JSON.stringify(guardados));
    return "demo";
  }
  const { db, F } = await firebase();
  const ref = await F.addDoc(F.collection(db, "leads"), {
    name: datos.name, email: datos.email.toLowerCase(), phone: datos.phone || "", courseInterest: datos.courseInterest || "",
    stage: "nuevo", source: datos.source || "formulario-web", consent: Boolean(datos.consent), userId: datos.userId || null,
    createdAt: F.serverTimestamp()
  });
  // Aviso al backend (correo de bienvenida, S4-10). Falla en silencio si no está configurado.
  if (window.APPS_SCRIPT_URL) {
    fetch(window.APPS_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ accion: "nuevoLead", leadId: ref.id, name: datos.name, email: datos.email }) }).catch(() => {});
  }
  return ref.id;
}
async function vincularLead(correo, uid) {
  try {
    const { db, F } = await firebase();
    const snap = await F.getDocs(F.query(F.collection(db, "leads"), F.where("email", "==", correo.toLowerCase())));
    await Promise.all(snap.docs.map(d => F.updateDoc(d.ref, { userId: uid })));
  } catch (e) { /* el usuario quizá no tiene permiso de leer leads; no es grave */ }
}
export async function obtenerLeads() {
  const { db, F } = await firebase();
  const snap = await F.getDocs(F.query(F.collection(db, "leads"), F.orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function actualizarLead(id, datos) {
  const { db, F } = await firebase();
  await F.updateDoc(F.doc(db, "leads", id), datos);
}
export async function agregarInteraccion(leadId, datos) {
  const { db, F } = await firebase();
  await F.addDoc(F.collection(db, "interactions"), { leadId, ...datos, date: F.serverTimestamp() });
}
export async function obtenerInteracciones(leadId) {
  const { db, F } = await firebase();
  const snap = await F.getDocs(F.query(F.collection(db, "interactions"), F.where("leadId", "==", leadId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
}

/* ============================================================
   INSCRIPCIONES, PROGRESO Y PAGOS
   ============================================================ */
export const idInscripcion = (uid, courseId) => `${uid}_${courseId}`;

export async function misInscripciones(uid) {
  const { db, F } = await firebase();
  const snap = await F.getDocs(F.query(F.collection(db, "enrollments"), F.where("userId", "==", uid), F.where("status", "==", "active")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function estaInscrito(uid, courseId) {
  if (!usaFirebase) return false;
  const { db, F } = await firebase();
  const snap = await F.getDoc(F.doc(db, "enrollments", idInscripcion(uid, courseId)));
  return snap.exists() && snap.data().status === "active";
}
/** Inscripción manual desde el panel (S3-07). */
export async function inscribirManual(uid, courseId, amount = 0) {
  const { db, F } = await firebase();
  await F.setDoc(F.doc(db, "enrollments", idInscripcion(uid, courseId)), {
    userId: uid, courseId, status: "active", paymentId: "manual", amount, createdAt: F.serverTimestamp()
  });
}
export async function obtenerInscripciones() {
  const { db, F } = await firebase();
  const snap = await F.getDocs(F.collection(db, "enrollments"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function obtenerProgreso(uid, courseId) {
  if (!usaFirebase) return new Set();
  const { db, F } = await firebase();
  const snap = await F.getDocs(F.query(F.collection(db, "progress"), F.where("userId", "==", uid), F.where("courseId", "==", courseId)));
  return new Set(snap.docs.map(d => d.data().lessonId));
}
export async function marcarCompletada(uid, courseId, lessonId) {
  const { db, F } = await firebase();
  await F.setDoc(F.doc(db, "progress", `${uid}_${lessonId}`), { userId: uid, courseId, lessonId, completedAt: F.serverTimestamp() });
}
export async function obtenerTodoProgreso() {
  const { db, F } = await firebase();
  const snap = await F.getDocs(F.collection(db, "progress"));
  return snap.docs.map(d => d.data());
}
export async function obtenerPagos() {
  const { db, F } = await firebase();
  const snap = await F.getDocs(F.collection(db, "payments"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function misPagos(uid) {
  const { db, F } = await firebase();
  const snap = await F.getDocs(F.query(F.collection(db, "payments"), F.where("userId", "==", uid)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function obtenerUsuarios() {
  const { db, F } = await firebase();
  const snap = await F.getDocs(F.collection(db, "users"));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}
export async function cambiarRol(uid, role) {
  const { db, F } = await firebase();
  await F.updateDoc(F.doc(db, "users", uid), { role });
}

/* ============================================================
   RECURSOS (Sprint 5)
   ============================================================ */
export async function obtenerRecursos() {
  const { db, F } = await firebase();
  const snap = await F.getDocs(F.collection(db, "resources"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function guardarRecurso(id, datos) {
  const { db, F } = await firebase();
  if (id) await F.setDoc(F.doc(db, "resources", id), datos, { merge: true });
  else await F.addDoc(F.collection(db, "resources"), { ...datos, createdAt: F.serverTimestamp() });
}
export async function eliminarRecurso(id) {
  const { db, F } = await firebase();
  await F.deleteDoc(F.doc(db, "resources", id));
}

/* ============================================================
   PAGOS: crear el cobro en la pasarela a través de Apps Script
   ============================================================ */
export async function crearPago(uid, courseId, correo) {
  if (!window.APPS_SCRIPT_URL) throw new Error("El backend de pagos aún no está configurado (APPS_SCRIPT_URL vacío).");
  const resp = await fetch(window.APPS_SCRIPT_URL, {
    method: "POST", headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ accion: "crearPago", userId: uid, courseId, email: correo, origen: location.origin + location.pathname.replace(/[^/]*$/, "") })
  });
  const datos = await resp.json();
  if (!datos.ok) throw new Error(datos.error || "No se pudo crear el pago");
  return datos; // { ok, url }
}
