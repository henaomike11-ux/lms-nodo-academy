/* ============================================================
   Nodo Academy · app.js
   Funciones compartidas por todas las páginas: header, footer,
   utilidades de formato y mensajes.
   ============================================================ */

import { usaFirebase, onUser, logout } from "./db.js";

export const MARCA = {
  nombre: "Nodo Academy",
  lema: "Cursos de tecnología y desarrollo web para principiantes",
  correo: "henaomike11@gmail.com",
  whatsapp: "+57 314 688 2183",
  whatsappLink: "https://wa.me/573146882183",
  ciudad: "Colombia"
};

/* Isotipo del logo: una N formada por líneas y nodos (red conectada) */
const LOGO_N = '<svg width="26" height="26" viewBox="8 8 48 48" aria-hidden="true"><path d="M18 47V17L46 47V17" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><g fill="#fff"><circle cx="18" cy="47" r="6.5"/><circle cx="18" cy="17" r="6.5"/><circle cx="46" cy="47" r="6.5"/><circle cx="46" cy="17" r="6.5"/></g></svg>';

/* ---------- Utilidades ---------- */
export const $ = (sel, raiz = document) => raiz.querySelector(sel);
export const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

export function formatoCOP(valor) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(valor || 0);
}

export function escapar(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function parametro(nombre) {
  return new URLSearchParams(location.search).get(nombre);
}

export function fechaCorta(valor) {
  if (!valor) return "";
  const d = valor.toDate ? valor.toDate() : new Date(valor);
  return d.toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}

let toastTimer;
export function toast(mensaje, ms = 2600) {
  let el = $("#toast");
  if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; document.body.appendChild(el); }
  el.textContent = mensaje; el.classList.add("visible");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("visible"), ms);
}

/* ---------- Header y footer ---------- */
export function renderHeader(usuario) {
  const cont = $("#header");
  if (!cont) return;
  const enlacesPublicos = `
    <a href="index.html">Inicio</a>
    <a href="cursos.html">Cursos</a>
    <a href="index.html#como-funciona">Cómo funciona</a>`;
  let enlacesSesion;
  if (usuario) {
    enlacesSesion = `
      <a href="mis-cursos.html">Mis cursos</a>
      ${usuario.role === "admin" ? '<a href="admin.html">Panel</a>' : ""}
      <a href="perfil.html">${escapar(usuario.name || usuario.email)}</a>
      <button class="btn btn-contorno btn-pequeno" id="btn-salir">Salir</button>`;
  } else {
    enlacesSesion = `
      <a href="login.html">Entrar</a>
      <a href="cursos.html" class="btn btn-primario btn-pequeno">Ver cursos</a>`;
  }
  cont.innerHTML = `
    <header class="header">
      <div class="contenedor">
        <a class="logo" href="index.html"><span class="logo-marca">${LOGO_N}</span>${MARCA.nombre}</a>
        <button class="btn-menu" id="btn-menu" aria-label="Abrir menú" aria-expanded="false">☰</button>
        <nav class="nav" id="nav">${enlacesPublicos}${enlacesSesion}</nav>
      </div>
    </header>
    ${usaFirebase ? "" : '<div class="banner-demo">Modo demostración (Sprint 1): los datos vienen de js/datos.js. El inicio de sesión y la base de datos se activan en el Sprint 2.</div>'}`;
  $("#btn-menu").addEventListener("click", () => {
    const nav = $("#nav"); const abierto = nav.classList.toggle("abierto");
    $("#btn-menu").setAttribute("aria-expanded", abierto);
  });
  $("#btn-salir")?.addEventListener("click", async () => { await logout(); location.href = "index.html"; });
}

export function renderFooter() {
  const cont = $("#footer");
  if (!cont) return;
  cont.innerHTML = `
    <footer class="footer">
      <div class="contenedor footer-grid">
        <div>
          <a class="logo" href="index.html" style="color:#fff"><span class="logo-marca">${LOGO_N}</span>${MARCA.nombre}</a>
          <p style="margin-top:12px;max-width:380px">${MARCA.lema}. Acceso de por vida y certificado de finalización.</p>
          <p><a href="mailto:${MARCA.correo}">${MARCA.correo}</a><br><a href="${MARCA.whatsappLink}" target="_blank" rel="noopener">WhatsApp ${MARCA.whatsapp}</a></p>
        </div>
        <div>
          <h4>Plataforma</h4>
          <a href="cursos.html">Catálogo de cursos</a>
          <a href="login.html">Entrar / Registrarse</a>
          <a href="mis-cursos.html">Mis cursos</a>
        </div>
        <div>
          <h4>Legal</h4>
          <a href="legales.html#datos">Tratamiento de datos personales</a>
          <a href="legales.html#terminos">Términos y condiciones</a>
          <a href="legales.html#reembolso">Política de reembolso</a>
        </div>
      </div>
      <div class="contenedor legal">© ${new Date().getFullYear()} ${MARCA.nombre} · Proyecto académico E-Business · Hecho en ${MARCA.ciudad}</div>
    </footer>`;
}

/* ---------- Arranque común ----------
   Devuelve una promesa con el usuario actual (o null) y pinta header/footer. */
export function iniciarPagina() {
  renderFooter();
  return new Promise(resolver => {
    onUser(usuario => { renderHeader(usuario); resolver(usuario); });
  });
}

/* Redirige si no hay sesión (páginas de estudiante) */
export async function requerirSesion() {
  const u = await iniciarPagina();
  if (!u) { location.href = `login.html?siguiente=${encodeURIComponent(location.pathname.split("/").pop() + location.search)}`; return null; }
  return u;
}

/* Redirige si no es administrador */
export async function requerirAdmin() {
  const u = await iniciarPagina();
  if (!u) { location.href = "login.html?siguiente=admin.html"; return null; }
  if (u.role !== "admin") { toast("Solo el equipo administrador puede entrar aquí."); setTimeout(() => location.href = "index.html", 1200); return null; }
  return u;
}
