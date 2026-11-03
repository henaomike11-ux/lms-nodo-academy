/* Nodo Academy · leccion.js — aula virtual: video, texto, material, navegación y "Marcar como completada".
   Paywall: si el usuario no tiene inscripción activa, muestra el botón de compra en vez del contenido.
   (Las reglas de Firestore también bloquean la lectura de lessons a quien no está inscrito: doble protección.) */
import { requerirSesion, $, escapar, parametro, toast } from "./app.js";
import { obtenerCurso, obtenerLecciones, obtenerProgreso, marcarCompletada, estaInscrito } from "./db.js";

const usuario = await requerirSesion();
if (usuario) {
  const cont = $("#aula");
  const courseId = parametro("curso"); const lessonId = parametro("leccion");
  const curso = await obtenerCurso(courseId);
  if (!curso) { cont.innerHTML = '<div class="vacio">Curso no encontrado.</div>'; }
  else if (!(await estaInscrito(usuario.uid, courseId)) && usuario.role !== "admin") {
    cont.innerHTML = `<div class="estado estado-pendiente tarjeta"><div class="icono-grande">🔒</div><h2>Este contenido es para estudiantes inscritos</h2><p class="texto-suave">Compra el curso <strong>${escapar(curso.title)}</strong> y entra al aula de inmediato.</p><a class="btn btn-primario" href="curso.html?id=${encodeURIComponent(courseId)}">Ver el curso</a></div>`;
  } else {
    const [lecciones, progreso] = await Promise.all([obtenerLecciones(courseId), obtenerProgreso(usuario.uid, courseId)]);
    const indice = Math.max(0, lecciones.findIndex(l => l.id === lessonId));
    const leccion = lecciones[indice];
    if (!leccion) { cont.innerHTML = '<div class="vacio">Este curso aún no tiene lecciones publicadas.</div>'; }
    else {
      document.title = `${leccion.title} · ${curso.title}`;
      const anterior = lecciones[indice - 1], siguiente = lecciones[indice + 1];
      const enlace = (l) => `leccion.html?curso=${encodeURIComponent(courseId)}&leccion=${encodeURIComponent(l.id)}`;

      // Navegación lateral agrupada por módulo
      let nav = "", moduloActual = null;
      for (const l of lecciones) {
        if (l.moduleNumber !== moduloActual) { moduloActual = l.moduleNumber; nav += `<h4>Módulo ${l.moduleNumber} · ${escapar(l.moduleName)}</h4>`; }
        nav += `<a href="${enlace(l)}" class="${l.id === leccion.id ? "actual" : ""} ${progreso.has(l.id) ? "hecha" : ""}">${escapar(l.title)}</a>`;
      }
      const hechas = lecciones.filter(l => progreso.has(l.id)).length;
      const pct = Math.round(hechas / lecciones.length * 100);
      const completada = progreso.has(leccion.id);

      cont.innerHTML = `
        <p style="margin-bottom:8px"><a href="mis-cursos.html">← Mis cursos</a> · <strong>${escapar(curso.title)}</strong></p>
        <div class="barra" style="margin-bottom:20px"><span style="width:${pct}%"></span></div>
        <div class="aula">
          <nav class="aula-nav" aria-label="Lecciones">${nav}</nav>
          <div>
            <span class="chip chip-primario">Lección ${indice + 1} de ${lecciones.length}</span>
            <h1 style="font-size:1.7rem;margin-top:10px">${escapar(leccion.title)}</h1>
            <div class="video">${video(leccion.videoUrl)}</div>
            <div class="tarjeta" style="margin-top:20px"><p style="margin:0;white-space:pre-line">${escapar(leccion.content || "")}</p>
              ${leccion.materialUrl ? `<p style="margin:14px 0 0"><a class="btn btn-contorno btn-pequeno" href="${escapar(leccion.materialUrl)}" target="_blank" rel="noopener">⬇ Descargar material</a></p>` : ""}
            </div>
            <div class="aula-acciones">
              ${anterior ? `<a class="btn btn-contorno" href="${enlace(anterior)}">← Anterior</a>` : "<span></span>"}
              <button class="btn ${completada ? "btn-secundario" : "btn-primario"}" id="btn-completar" ${completada ? "disabled" : ""}>${completada ? "✓ Completada" : "Marcar como completada"}</button>
              ${siguiente ? `<a class="btn btn-contorno" href="${enlace(siguiente)}">Siguiente →</a>` : `<a class="btn btn-acento" href="mis-cursos.html">Terminar</a>`}
            </div>
          </div>
        </div>`;

      $("#btn-completar").addEventListener("click", async (ev) => {
        const b = ev.currentTarget; b.disabled = true;
        try {
          await marcarCompletada(usuario.uid, courseId, leccion.id);
          b.textContent = "✓ Completada"; b.classList.replace("btn-primario", "btn-secundario");
          $(".aula-nav a.actual").classList.add("hecha");
          const nuevoPct = Math.round((hechas + 1) / lecciones.length * 100);
          $(".barra span").style.width = nuevoPct + "%";
          toast(nuevoPct === 100 ? "🎓 ¡Completaste el curso!" : "Lección completada");
        } catch (e) { console.error(e); b.disabled = false; toast("No se pudo guardar. Intenta de nuevo."); }
      });
    }
  }
}

function video(url) {
  if (!url) return '<div style="padding:24px;text-align:center"><div style="font-size:2rem">🎬</div><p style="margin:8px 0 0;color:#c9cce0">Video en producción. Lee el contenido de la lección abajo.</p></div>';
  const yt = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  if (yt) return `<iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0" title="Video de la lección" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `<iframe src="https://player.vimeo.com/video/${vimeo[1]}" title="Video de la lección" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  return `<video controls src="${escapar(url)}" style="width:100%;height:100%"></video>`;
}
