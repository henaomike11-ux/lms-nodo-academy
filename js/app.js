/* ============================================================
   Nodo Academy · app.js
   Funciones compartidas por todas las páginas: header, footer,
   utilidades de formato y mensajes.
   ============================================================ */

import { usaFirebase, onUser, logout } from "./db.js";

export const MARCA = {
  nombre: "Nodo Academy",
  lema: "Cursos de tecnología y desarrollo web para principiantes",
  eslogan: "Aprende haciendo",
  correo: "henaomike11@gmail.com",
  whatsapp: "+57 314 688 2183",
  whatsappLink: "https://wa.me/573146882183",
  ciudad: "Colombia"
};

/* Isotipo del logo: una N formada por líneas y nodos (red conectada) */
const LOGO_N = '<svg width="26" height="26" viewBox="8 8 48 48" aria-hidden="true"><path d="M18 47V17L46 47V17" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><g fill="#fff"><circle cx="18" cy="47" r="6.5"/><circle cx="18" cy="17" r="6.5"/><circle cx="46" cy="47" r="6.5"/><circle cx="46" cy="17" r="6.5"/></g></svg>';

/* ---------- Google Analytics 4 ----------
   Pega aquí tu ID de medición (formato G-XXXXXXXXXX). Mientras esté vacío, no se carga nada. */
const GA_ID = "G-SC2P4Z1WP7";

function iniciarAnalytics() {
  if (!GA_ID || window.gtag) return;
  const s = document.createElement("script");
  s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID);
}

/** Envía un evento a Google Analytics (si está activado). Ej.: evento("generate_lead") */
export function evento(nombre, params = {}) {
  if (window.gtag) window.gtag("event", nombre, params);
}

/* Fuerza al navegador a pedir el favicon actualizado (sube este número cuando cambies img/favicon.svg) */
const FAVICON_V = "2";
function actualizarFavicon() {
  document.querySelectorAll('link[rel="icon"]').forEach(l => {
    const base = (l.getAttribute("href") || "").split("?")[0];
    if (base) l.setAttribute("href", `${base}?v=${FAVICON_V}`);
  });
}

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

/* ---------- Aviso de cookies ----------
   En Colombia no hay una ley específica de cookies, pero si recogen datos personales aplica la Ley 1581 de 2012
   (autorización previa, expresa e informada). Por eso Google Analytics solo se carga si la persona pulsa «Aceptar». */
const CLAVE_COOKIES = "cookies-nodo";
function leerCookies() { try { return localStorage.getItem(CLAVE_COOKIES); } catch (e) { return null; } }
function guardarCookies(valor) { try { localStorage.setItem(CLAVE_COOKIES, valor); } catch (e) { /* no es grave */ } }
function borrarCookiesAnalytics() {
  document.cookie.split(";").map(c => c.split("=")[0].trim()).filter(n => n === "_ga" || n.startsWith("_ga_")).forEach(n => {
    document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${location.hostname}`;
  });
}

const ESTILO_COOKIES = `
#aviso-cookies { position: fixed; left: 0; right: 0; bottom: 0; z-index: 90; background: rgba(255, 255, 255, .97); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); border-top: 1px solid var(--borde, #E3E6F0); box-shadow: 0 -8px 28px rgba(30, 34, 51, .10); padding: 22px 0 calc(18px + env(safe-area-inset-bottom, 0px)); animation: cookies-sube .35s ease both; }
#aviso-cookies::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 4px; background: linear-gradient(90deg, var(--primario, #3B4CCA), var(--secundario, #18C3B0)); }
#aviso-cookies .cookies-cuerpo { display: flex; flex-wrap: wrap; gap: 14px 20px; align-items: center; width: min(100% - 32px, var(--ancho-max, 1120px)); margin-inline: auto; }
#aviso-cookies .cookies-icono { flex: none; width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; background: rgba(59, 76, 202, .1); }
#aviso-cookies .cookies-texto { flex: 1 1 240px; min-width: 0; }
#aviso-cookies h2 { font-size: 1.05rem; margin: 0 0 4px; }
#aviso-cookies p { margin: 0; font-size: .9rem; color: var(--texto-suave, #5B6075); }
#aviso-cookies .cookies-acciones { display: flex; gap: 10px; flex: none; }
@media (max-width: 639px) { #aviso-cookies .cookies-acciones { flex: 1 1 100%; } #aviso-cookies .cookies-acciones .btn { flex: 1; } }
@keyframes cookies-sube { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { #aviso-cookies { animation: none; } }
`;

export function avisoCookies(forzar = false) {
  const estado = leerCookies();
  if (estado === "si") iniciarAnalytics();
  if ((estado && !forzar) || $("#aviso-cookies")) return;
  const caja = document.createElement("div");
  caja.id = "aviso-cookies";
  caja.setAttribute("role", "dialog");
  caja.setAttribute("aria-label", "Aviso de cookies");
  if (!$("#estilo-cookies")) {
    const st = document.createElement("style");
    st.id = "estilo-cookies"; st.textContent = ESTILO_COOKIES;
    document.head.appendChild(st);
  }
  caja.innerHTML = `
    <div class="cookies-cuerpo">
      <div class="cookies-icono"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B4CCA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/><path d="M11 17v.01"/><path d="M7 14v.01"/></svg></div>
      <div class="cookies-texto">
        <h2>Tú decides sobre las cookies</h2>
        <p>Usamos cookies de Google Analytics para medir cómo se usa el sitio y mejorarlo. Solo se activan si las aceptas. Más información en la <a href="legales.html#cookies">política de cookies</a>.</p>
      </div>
      <div class="cookies-acciones"><button class="btn btn-contorno btn-pequeno" id="cookies-no">Rechazar</button><button class="btn btn-primario btn-pequeno" id="cookies-si">Aceptar</button></div>
    </div>`;
  document.body.appendChild(caja);
  $("#cookies-si").addEventListener("click", () => {
    guardarCookies("si");
    if (GA_ID) window["ga-disable-" + GA_ID] = false;
    iniciarAnalytics(); caja.remove();
  });
  $("#cookies-no").addEventListener("click", () => {
    guardarCookies("no");
    if (GA_ID) window["ga-disable-" + GA_ID] = true;
    borrarCookiesAnalytics(); caja.remove();
  });
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
          <p style="margin:10px 0 0;font-family:var(--fuente-titulos);font-weight:600">${MARCA.eslogan}</p>
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
          <a href="legales.html#cookies">Política de cookies</a>
          <a href="#" id="cookies-config">Preferencias de cookies</a>
        </div>
      </div>
      <div class="contenedor legal">© ${new Date().getFullYear()} ${MARCA.nombre} · Proyecto académico E-Business · Hecho en ${MARCA.ciudad}</div>
    </footer>`;
  $("#cookies-config")?.addEventListener("click", (e) => { e.preventDefault(); avisoCookies(true); });
}

/* ---------- Arranque común ----------
   Devuelve una promesa con el usuario actual (o null) y pinta header/footer. */
export function iniciarPagina() {
  actualizarFavicon();
  avisoCookies();
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
