/* Nodo Academy · inicio.js — landing page: cursos destacados, FAQ y formulario de interés (CRM) */
import { iniciarPagina, $, $$, escapar, formatoCOP, toast } from "./app.js";
import { obtenerCursos, crearLead } from "./db.js";
import { tarjetaCurso } from "./cursos-ui.js";

const usuario = await iniciarPagina();

// Cursos destacados
try {
  const cursos = await obtenerCursos();
  const destacados = cursos.filter(c => c.featured).concat(cursos.filter(c => !c.featured)).slice(0, 2);
  $("#cursos-destacados").innerHTML = destacados.map(tarjetaCurso).join("") || '<div class="vacio">Pronto publicaremos nuevos cursos.</div>';
  $("#lead-curso").insertAdjacentHTML("beforeend", cursos.map(c => `<option value="${escapar(c.id)}">${escapar(c.title)}</option>`).join(""));
} catch (e) {
  console.error(e);
  $("#cursos-destacados").innerHTML = '<div class="vacio">No pudimos cargar los cursos. Intenta de nuevo.</div>';
}

// FAQ
$("#faq-lista").innerHTML = (window.DATOS?.faq || []).map(f => `<details><summary>${escapar(f.q)}</summary><p>${escapar(f.a)}</p></details>`).join("");

// Formulario "Quiero más información" → leads
const form = $("#form-lead");
form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  $$("[data-error]", form).forEach(e => e.textContent = "");
  const datos = Object.fromEntries(new FormData(form).entries());
  let valido = true;
  if (!datos.name || datos.name.trim().length < 3) { $('[data-error="name"]', form).textContent = "Escribe tu nombre completo."; valido = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email || "")) { $('[data-error="email"]', form).textContent = "Escribe un correo válido."; valido = false; }
  if (!datos.consent) { $('[data-error="consent"]', form).textContent = "Necesitamos tu autorización para guardar tus datos."; valido = false; }
  if (!valido) return;

  const boton = $("button[type=submit]", form); boton.disabled = true; boton.textContent = "Enviando…";
  try {
    await crearLead({ ...datos, name: datos.name.trim(), consent: true, source: "formulario-web", userId: usuario?.uid || null });
    form.reset();
    $("#lead-mensaje").innerHTML = '<div class="mensaje mensaje-exito">¡Listo! Te escribiremos pronto con la información de los cursos.</div>';
    toast("Datos enviados");
  } catch (e) {
    console.error(e);
    $("#lead-mensaje").innerHTML = '<div class="mensaje mensaje-error">No pudimos guardar tus datos. Intenta de nuevo en un momento.</div>';
  } finally { boton.disabled = false; boton.textContent = "Enviar"; }
});
