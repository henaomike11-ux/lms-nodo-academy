/* Nodo Academy · certificado.js — certificado de finalización: certificado.html?curso=ID
   Solo se muestra si el estudiante está inscrito y completó el 100 % de las lecciones. */
import { requerirSesion, $, escapar, parametro, evento } from "./app.js";
import { obtenerCurso, obtenerLecciones, obtenerProgreso, estaInscrito, fechaFinalizacion } from "./db.js";

// Código corto y estable para identificar el certificado (mismo estudiante + mismo curso = mismo código)
function codigoCertificado(texto) {
  let h = 5381;
  for (const c of texto) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0;
  return "NA-" + h.toString(36).toUpperCase().padStart(7, "0");
}

// Isotipo de marca (la N hecha de nodos) con degradado propio para no chocar con otros SVG de la página
const ISOTIPO = '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="cert-g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="64" y2="64"><stop offset="0" stop-color="#3B4CCA"/><stop offset="1" stop-color="#18C3B0"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#cert-g)"/><path d="M18 47V17L46 47V17" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><g fill="#fff"><circle cx="18" cy="47" r="6.5"/><circle cx="18" cy="17" r="6.5"/><circle cx="46" cy="47" r="6.5"/><circle cx="46" cy="17" r="6.5"/></g><g fill="url(#cert-g)"><circle cx="18" cy="47" r="2.6"/><circle cx="18" cy="17" r="2.6"/><circle cx="46" cy="47" r="2.6"/><circle cx="46" cy="17" r="2.6"/></g></svg>';

const usuario = await requerirSesion();
if (usuario) {
  const cont = $("#certificado");
  const courseId = parametro("curso");
  const curso = courseId ? await obtenerCurso(courseId) : null;

  if (!curso) {
    cont.innerHTML = '<div class="vacio">No se indicó de qué curso es el certificado. <a href="mis-cursos.html">Ir a Mis cursos</a></div>';
  } else if (!(await estaInscrito(usuario.uid, curso.id))) {
    cont.innerHTML = `<div class="vacio">No estás inscrito en «${escapar(curso.title)}». <a href="mis-cursos.html">Ir a Mis cursos</a></div>`;
  } else {
    const [lecciones, hechas] = await Promise.all([obtenerLecciones(curso.id), obtenerProgreso(usuario.uid, curso.id)]);
    const completas = lecciones.filter(l => hechas.has(l.id)).length;

    if (!lecciones.length || completas < lecciones.length) {
      cont.innerHTML = `<div class="tarjeta" style="text-align:center">
        <h1 style="font-size:1.6rem">Aún no puedes descargar el certificado</h1>
        <p class="texto-suave">El certificado se entrega al completar el 100 % de las lecciones de <strong>${escapar(curso.title)}</strong>. Llevas ${completas} de ${lecciones.length}.</p>
        <a class="btn btn-primario" href="mis-cursos.html">Volver a Mis cursos</a></div>`;
    } else {
      const fecha = (await fechaFinalizacion(usuario.uid, curso.id)) || new Date();
      const fechaTexto = fecha.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
      const nombre = usuario.name || usuario.email;
      const codigo = codigoCertificado(`${usuario.uid}_${curso.id}`);
      cont.innerHTML = `
        <div class="cert" id="cert">
          <div class="cert-logo">${ISOTIPO}<span>Nodo Academy</span></div>
          <p class="cert-etiqueta">Certificado de finalización</p>
          <p class="cert-texto">Se certifica que</p>
          <h1 class="cert-nombre">${escapar(nombre)}</h1>
          <p class="cert-texto">completó el 100 % de las lecciones del curso</p>
          <h2 class="cert-curso">${escapar(curso.title)}</h2>
          <p class="cert-fecha">${escapar(fechaTexto)}</p>
          <div class="cert-firmas">
            <div class="cert-firma">Mike Henao<span>Equipo fundador</span></div>
            <div class="cert-firma">Juan Oduber<span>Equipo fundador</span></div>
            <div class="cert-firma">Jose García<span>Equipo fundador</span></div>
          </div>
          <p class="cert-pie">Aprende haciendo · Código del certificado <strong>${codigo}</strong> · Certifica la finalización del curso, no una titulación oficial.</p>
        </div>
        <div class="cert-acciones no-imprimir">
          <button class="btn btn-primario" id="btn-imprimir">Descargar PDF</button>
          <a class="btn btn-contorno" href="mis-cursos.html">Volver a Mis cursos</a>
        </div>
        <p class="texto-suave no-imprimir" style="text-align:center;font-size:.85rem;margin-top:10px">En el cuadro de impresión elige «Guardar como PDF» como destino.</p>`;
      $("#btn-imprimir").addEventListener("click", () => { evento("certificate_download", { item_id: curso.id }); window.print(); });
    }
  }
}
