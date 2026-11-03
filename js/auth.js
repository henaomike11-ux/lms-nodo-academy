/* Nodo Academy · auth.js — registro, inicio de sesión, Google y recuperar contraseña */
import { iniciarPagina, $, $$, parametro, toast } from "./app.js";
import { usaFirebase, registrar, entrar, entrarConGoogle, recuperarClave } from "./db.js";

const usuario = await iniciarPagina();
const siguiente = parametro("siguiente") || "mis-cursos.html";
if (usuario) location.replace(siguiente);

if (!usaFirebase) {
  $("#aviso-demo").classList.remove("oculto");
  $$("#form-entrar input, #form-entrar button, #form-registro input, #form-registro button").forEach(e => e.disabled = true);
}
if (parametro("tab") === "registro") cambiarPestana("registro");

// Pestañas
$$(".pestana").forEach(b => b.addEventListener("click", () => cambiarPestana(b.dataset.tab)));
function cambiarPestana(tab) {
  $$(".pestana").forEach(b => b.classList.toggle("activa", b.dataset.tab === tab));
  $("#form-entrar").classList.toggle("oculto", tab !== "entrar");
  $("#form-registro").classList.toggle("oculto", tab !== "registro");
}

const MENSAJES = {
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/user-not-found": "No existe una cuenta con ese correo.",
  "auth/wrong-password": "Contraseña incorrecta.",
  "auth/email-already-in-use": "Ya existe una cuenta con ese correo. Intenta entrar.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/invalid-email": "El correo no es válido.",
  "auth/unauthorized-domain": "Este dominio no está autorizado en Firebase (Authentication → Configuración → Dominios autorizados).",
  "auth/popup-closed-by-user": "Cerraste la ventana de Google antes de terminar."
};
const traducir = (e) => MENSAJES[e.code] || e.message || "Ocurrió un error. Intenta de nuevo.";
const mostrar = (sel, texto, tipo = "error") => $(sel).innerHTML = `<div class="mensaje mensaje-${tipo}">${texto}</div>`;

$("#form-entrar").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const f = ev.target; if (!f.reportValidity()) return;
  try { await entrar(f.email.value.trim(), f.password.value); location.href = siguiente; }
  catch (e) { mostrar("#mensaje-entrar", traducir(e)); }
});

$("#form-registro").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const f = ev.target; if (!f.reportValidity()) return;
  try { await registrar(f.name.value.trim(), f.email.value.trim(), f.password.value); toast("¡Cuenta creada!"); location.href = siguiente; }
  catch (e) { mostrar("#mensaje-registro", traducir(e)); }
});

for (const id of ["#btn-google", "#btn-google-2"]) {
  $(id).addEventListener("click", async () => {
    try { await entrarConGoogle(); location.href = siguiente; }
    catch (e) { mostrar("#mensaje-entrar", traducir(e)); cambiarPestana("entrar"); }
  });
}

$("#link-recuperar").addEventListener("click", async (ev) => {
  ev.preventDefault();
  const correo = $("#e-correo").value.trim();
  if (!correo) { mostrar("#mensaje-entrar", "Escribe tu correo arriba y vuelve a pulsar «Olvidé mi contraseña»."); return; }
  try { await recuperarClave(correo); mostrar("#mensaje-entrar", "Te enviamos un correo para cambiar la contraseña.", "exito"); }
  catch (e) { mostrar("#mensaje-entrar", traducir(e)); }
});
