/* Nodo Academy · cursos-ui.js — componente de tarjeta de curso (lo usan inicio y catálogo) */
import { escapar, formatoCOP } from "./app.js";

export function tarjetaCurso(curso, indice = 0) {
  const portada = curso.imageUrl
    ? `<img src="${escapar(curso.imageUrl)}" alt="${escapar(curso.title)}" style="aspect-ratio:16/9;object-fit:cover;width:100%">`
    : `<div class="portada ${indice % 2 ? "alt" : ""}">${escapar(curso.title)}</div>`;
  return `
    <article class="tarjeta tarjeta-curso">
      <a href="curso.html?id=${encodeURIComponent(curso.id)}" style="text-decoration:none;color:inherit">${portada}</a>
      <div class="cuerpo">
        <div><span class="chip">${escapar(curso.category)}</span> <span class="chip chip-gris">${escapar(curso.level)}</span></div>
        <h3 style="margin:0">${escapar(curso.title)}</h3>
        <p class="texto-suave" style="margin:0;font-size:.93rem">${escapar(curso.promise || curso.description)}</p>
        <div class="meta"><span>⏱ ${escapar(curso.duration || "")}</span></div>
        <div class="pie">
          <span class="precio">${formatoCOP(curso.price)}</span>
          <a class="btn btn-primario btn-pequeno" href="curso.html?id=${encodeURIComponent(curso.id)}">Ver curso</a>
        </div>
      </div>
    </article>`;
}
