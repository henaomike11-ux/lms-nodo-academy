/* Nodo Academy · curso.js — detalle del curso: temario, instructor, precio y botón Comprar */
import { iniciarPagina, $, escapar, formatoCOP, parametro, toast } from "./app.js";
import { obtenerCurso, obtenerLecciones, obtenerInstructor, estaInscrito, usaFirebase } from "./db.js";

const usuario = await iniciarPagina();
const id = parametro("id");
const cont = $("#detalle .contenedor");

const curso = id ? await obtenerCurso(id) : null;
if (!curso || !curso.published) {
  cont.innerHTML = '<div class="vacio"><h2>Curso no encontrado</h2><p>Puede que el enlace esté mal escrito o el curso ya no esté disponible.</p><a class="btn btn-primario" href="cursos.html">Ir al catálogo</a></div>';
} else {
  document.title = `${curso.title} · Nodo Academy`;
  const [lecciones, instructor, inscrito] = await Promise.all([
    obtenerLecciones(curso.id),
    obtenerInstructor(curso.instructorId),
    usuario ? estaInscrito(usuario.uid, curso.id) : false
  ]);

  // Agrupar lecciones por módulo
  const modulos = new Map();
  for (const l of lecciones) {
    const clave = `${l.moduleNumber}. ${l.moduleName}`;
    if (!modulos.has(clave)) modulos.set(clave, []);
    modulos.get(clave).push(l);
  }

  let accion;
  if (inscrito) accion = `<a class="btn btn-secundario btn-bloque" href="mis-cursos.html">Ya tienes este curso · Ir al aula</a>`;
  else if (!usaFirebase) accion = `<button class="btn btn-primario btn-bloque" id="btn-comprar">Comprar</button><p class="texto-suave" style="font-size:.85rem;margin-top:8px">El pago en línea se activa en el Sprint 4.</p>`;
  else if (!usuario) accion = `<a class="btn btn-primario btn-bloque" href="login.html?siguiente=${encodeURIComponent("curso.html?id=" + curso.id)}">Entrar para comprar</a>`;
  else accion = `<a class="btn btn-primario btn-bloque" href="pago.html?curso=${encodeURIComponent(curso.id)}">Comprar</a>`;

  cont.innerHTML = `
    <div class="detalle-grid">
      <div>
        <div><span class="chip">${escapar(curso.category)}</span> <span class="chip chip-gris">${escapar(curso.level)}</span> <span class="chip chip-gris">⏱ ${escapar(curso.duration || "")}</span></div>
        <h1 style="margin-top:12px">${escapar(curso.title)}</h1>
        <p class="texto-suave" style="font-size:1.1rem">${escapar(curso.description)}</p>

        ${curso.outcomes?.length ? `<h3>Qué vas a lograr</h3><ul class="lista-check">${curso.outcomes.map(o => `<li>${escapar(o)}</li>`).join("")}</ul>` : ""}

        <h3 style="margin-top:28px">Temario</h3>
        <p class="texto-suave">${modulos.size} módulos · ${lecciones.length} lecciones</p>
        <div class="temario">
          ${[...modulos].map(([nombre, ls]) => `<div class="modulo"><h4>${escapar(nombre)}</h4><ol>${ls.map(l => `<li>${escapar(l.title)}</li>`).join("")}</ol></div>`).join("") || '<div class="vacio">El temario se publicará pronto.</div>'}
        </div>

        ${curso.requirements?.length ? `<h3 style="margin-top:28px">Requisitos</h3><ul class="texto-suave">${curso.requirements.map(r => `<li>${escapar(r)}</li>`).join("")}</ul>` : ""}

        <h3 style="margin-top:28px">Instructor</h3>
        <div class="tarjeta">
          <strong>${escapar(instructor?.name || "Por confirmar")}</strong>
          <div class="texto-suave" style="font-size:.9rem">${escapar(instructor?.specialty || "")}</div>
          <p class="texto-suave" style="margin:8px 0 0">${escapar(instructor?.bio || "")}</p>
        </div>
      </div>

      <aside>
        <div class="tarjeta caja-compra">
          <div class="precio">${formatoCOP(curso.price)}</div>
          <p class="texto-suave" style="font-size:.9rem">Pago único · Acceso de por vida</p>
          ${accion}
          <ul class="lista-check" style="margin-top:18px;font-size:.92rem">
            <li>${lecciones.length} lecciones en video</li>
            <li>Materiales descargables</li>
            <li>Certificado de finalización</li>
            <li>Reembolso en los primeros 7 días</li>
          </ul>
          <p class="texto-suave" style="font-size:.8rem;margin:0">¿Dudas? Escríbenos a hola@nodoacademy.co</p>
        </div>
      </aside>
    </div>`;

  $("#btn-comprar")?.addEventListener("click", () => toast("El pago en línea estará disponible en el Sprint 4."));
}
