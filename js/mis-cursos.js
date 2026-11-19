/* Nodo Academy · mis-cursos.js — panel del estudiante con barra de progreso */
import { requerirSesion, $, escapar, formatoCOP } from "./app.js";
import { misInscripciones, obtenerCurso, obtenerLecciones, obtenerProgreso } from "./db.js";

const usuario = await requerirSesion();
if (usuario) {
  const cont = $("#lista");
  try {
    const inscripciones = await misInscripciones(usuario.uid);
    if (!inscripciones.length) {
      cont.innerHTML = '<div class="vacio" style="grid-column:1/-1"><h3>Aún no tienes cursos</h3><p>Explora el catálogo y elige por dónde empezar.</p><a class="btn btn-primario" href="cursos.html">Ver catálogo</a></div>';
    } else {
      const tarjetas = await Promise.all(inscripciones.map(async (ins) => {
        const [curso, lecciones, progreso] = await Promise.all([obtenerCurso(ins.courseId), obtenerLecciones(ins.courseId), obtenerProgreso(usuario.uid, ins.courseId)]);
        if (!curso) return "";
        const total = lecciones.length, hechas = lecciones.filter(l => progreso.has(l.id)).length;
        const pct = total ? Math.round(hechas / total * 100) : 0;
        const siguiente = lecciones.find(l => !progreso.has(l.id)) || lecciones[0];
        return `
          <article class="tarjeta">
            <span class="chip">${escapar(curso.category)}</span>
            <h3 style="margin-top:10px">${escapar(curso.title)}</h3>
            <div class="texto-suave" style="font-size:.9rem;margin-bottom:8px">${hechas} de ${total} lecciones completadas · ${pct} %</div>
            <div class="barra"><span style="width:${pct}%"></span></div>
            <div class="fila-acciones" style="margin-top:16px">
              ${siguiente ? `<a class="btn btn-primario btn-pequeno" href="leccion.html?curso=${encodeURIComponent(curso.id)}&leccion=${encodeURIComponent(siguiente.id)}">${pct === 100 ? "Repasar" : hechas ? "Continuar" : "Empezar"}</a>` : ""}
              <a class="btn btn-contorno btn-pequeno" href="curso.html?id=${encodeURIComponent(curso.id)}">Ver temario</a>
              ${pct === 100 ? '<span class="chip chip-acento" style="align-self:center">🎓 Curso completado</span>' : ""}
            </div>
          </article>`;
      }));
      cont.innerHTML = tarjetas.join("");
    }
  } catch (e) {
    console.error(e);
    cont.innerHTML = '<div class="vacio" style="grid-column:1/-1">No pudimos cargar tus cursos. Revisa la consola del navegador.</div>';
  }
}
