/* Nodo Academy · pago.js — dos usos:
   1) pago.html?curso=ID        → crea el cobro en la pasarela (vía Apps Script) y redirige.
   2) pago.html?estado=exito|pendiente|rechazado&curso=ID → página de regreso desde la pasarela. */
import { requerirSesion, $, escapar, formatoCOP, parametro } from "./app.js";
import { obtenerCurso, crearPago, estaInscrito } from "./db.js";

const usuario = await requerirSesion();
if (usuario) {
  const cont = $("#pago");
  const estado = parametro("estado"); const courseId = parametro("curso");
  const curso = courseId ? await obtenerCurso(courseId) : null;

  if (estado) {
    const vistas = {
      exito: { clase: "estado-exito", icono: "✓", titulo: "¡Pago exitoso!", texto: "Tu curso se está activando. En unos segundos aparecerá en «Mis cursos»." },
      pendiente: { clase: "estado-pendiente", icono: "⏳", titulo: "Pago pendiente", texto: "La pasarela aún está confirmando tu pago (por ejemplo, PSE o efectivo). Cuando se apruebe, el curso se activará solo." },
      rechazado: { clase: "estado-error", icono: "✕", titulo: "Pago rechazado", texto: "La pasarela no aprobó el pago. Puedes intentarlo de nuevo con otro medio." }
    };
    const v = vistas[estado] || vistas.pendiente;
    cont.innerHTML = `
      <div class="estado ${v.clase} tarjeta">
        <div class="icono-grande">${v.icono}</div>
        <h1 style="font-size:1.8rem">${v.titulo}</h1>
        <p class="texto-suave">${v.texto}</p>
        ${curso ? `<p><strong>${escapar(curso.title)}</strong> · ${formatoCOP(curso.price)}</p>` : ""}
        <div class="fila-acciones" style="justify-content:center">
          <a class="btn btn-primario" href="mis-cursos.html" id="btn-ir">Ir a Mis cursos</a>
          ${estado === "rechazado" && curso ? `<a class="btn btn-contorno" href="pago.html?curso=${encodeURIComponent(curso.id)}">Intentar de nuevo</a>` : ""}
        </div>
        <p id="estado-vivo" class="texto-suave" style="font-size:.85rem;margin-top:16px"></p>
      </div>`;
    // Si el pago fue exitoso, esperamos a que el webhook cree la inscripción (hasta ~30 s)
    if (estado !== "rechazado" && curso) {
      for (let i = 0; i < 10; i++) {
        if (await estaInscrito(usuario.uid, curso.id)) { $("#estado-vivo").textContent = "✓ Curso activado. ¡Ya puedes entrar al aula!"; $("#btn-ir").textContent = "Entrar al aula"; break; }
        $("#estado-vivo").textContent = "Confirmando con la pasarela… (" + (i + 1) + "/10)";
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  } else if (!curso) {
    cont.innerHTML = '<div class="vacio">No se indicó qué curso comprar. <a href="cursos.html">Ir al catálogo</a></div>';
  } else if (await estaInscrito(usuario.uid, curso.id)) {
    location.replace("mis-cursos.html");
  } else {
    cont.innerHTML = `
      <div class="estado tarjeta">
        <h1 style="font-size:1.8rem">Confirmar compra</h1>
        <p><strong>${escapar(curso.title)}</strong></p>
        <div class="precio" style="font-size:2rem">${formatoCOP(curso.price)}</div>
        <p class="texto-suave">Te llevaremos a la pasarela de pago segura. Al aprobarse el pago, el curso se activa automáticamente en tu cuenta (${escapar(usuario.email)}).</p>
        <button class="btn btn-primario btn-bloque" id="btn-pagar">Ir a pagar</button>
        <div id="mensaje" style="margin-top:12px"></div>
      </div>`;
    $("#btn-pagar").addEventListener("click", async (ev) => {
      const b = ev.currentTarget; b.disabled = true; b.textContent = "Creando el cobro…";
      try { const r = await crearPago(usuario.uid, curso.id, usuario.email); location.href = r.url; }
      catch (e) { console.error(e); $("#mensaje").innerHTML = `<div class="mensaje mensaje-error">${escapar(e.message)}</div>`; b.disabled = false; b.textContent = "Ir a pagar"; }
    });
  }
}
