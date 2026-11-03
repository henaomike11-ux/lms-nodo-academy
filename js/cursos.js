/* Nodo Academy · cursos.js — catálogo con filtro por categoría */
import { iniciarPagina, $, $$, escapar } from "./app.js";
import { obtenerCursos } from "./db.js";
import { tarjetaCurso } from "./cursos-ui.js";

await iniciarPagina();

let cursos = [];
try { cursos = await obtenerCursos(); }
catch (e) { console.error(e); $("#lista-cursos").innerHTML = '<div class="vacio">No pudimos cargar los cursos.</div>'; }

const categorias = [...new Set(cursos.map(c => c.category).filter(Boolean))];
$("#filtros").insertAdjacentHTML("beforeend", categorias.map(c => `<button class="filtro" data-categoria="${escapar(c)}">${escapar(c)}</button>`).join(""));

function pintar(categoria = "") {
  const lista = cursos.filter(c => !categoria || c.category === categoria);
  $("#lista-cursos").innerHTML = lista.length
    ? lista.map((c, i) => tarjetaCurso(c, i)).join("")
    : '<div class="vacio">No hay cursos en esta categoría todavía.</div>';
}
pintar();

$("#filtros").addEventListener("click", (ev) => {
  const boton = ev.target.closest(".filtro"); if (!boton) return;
  $$(".filtro").forEach(b => b.classList.toggle("activo", b === boton));
  pintar(boton.dataset.categoria);
});
