/* ============================================================
   Nodo Academy · admin.js — panel del administrador
   Pestañas: Reportes · Cursos · Lecciones · CRM · Inscripciones ·
   Instructores · Recursos · Usuarios
   Solo entra quien tiene role: "admin" en users (requerirAdmin) y
   las reglas de Firestore lo verifican también del lado del servidor.
   ============================================================ */
import { requerirAdmin, $, $$, escapar, formatoCOP, fechaCorta, toast } from "./app.js";
import * as db from "./db.js";

const usuario = await requerirAdmin();
if (usuario) {
  if (!db.usaFirebase) {
    $("#panel").innerHTML = '<div class="mensaje mensaje-aviso">El panel necesita Firebase (Sprint 2). Configura js/firebase-config.js.</div>';
  } else {
    const panel = $("#panel");
    const vistas = { reportes, cursos, lecciones, crm, inscripciones, instructores, recursos, calendario, usuarios };
    $("#pestanas").addEventListener("click", (ev) => {
      const b = ev.target.closest(".pestana"); if (!b) return;
      $$(".pestana").forEach(p => p.classList.toggle("activa", p === b));
      location.hash = b.dataset.tab; cargar(b.dataset.tab);
    });
    const inicial = location.hash.slice(1) in vistas ? location.hash.slice(1) : "reportes";
    $$(".pestana").forEach(p => p.classList.toggle("activa", p.dataset.tab === inicial));
    cargar(inicial);

    async function cargar(tab) {
      panel.innerHTML = '<div class="cargando">Cargando…</div>';
      try { await vistas[tab](); }
      catch (e) { console.error(e); panel.innerHTML = `<div class="mensaje mensaje-error">Error: ${escapar(e.message)}. Revisa la consola y las reglas de Firestore.</div>`; }
    }
    const slug = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const opciones = (lista, valor, etiqueta = (x) => x.title || x.name) => lista.map(x => `<option value="${escapar(x.id || x.uid)}" ${(x.id || x.uid) === valor ? "selected" : ""}>${escapar(etiqueta(x))}</option>`).join("");

    /* ================= REPORTES (S5-04) ================= */
    async function reportes() {
      const [cursosL, pagos, insc, leads, progreso, recursosL, lecc] = await Promise.all([
        db.obtenerCursos({ todos: true }), db.obtenerPagos(), db.obtenerInscripciones(), db.obtenerLeads(), db.obtenerTodoProgreso(), db.obtenerRecursos(), Promise.all([])
      ]);
      const aprobados = pagos.filter(p => p.status === "approved");
      const ingresos = aprobados.reduce((s, p) => s + (p.amount || 0), 0);
      const clientes = leads.filter(l => l.stage === "cliente").length;
      const conversion = leads.length ? Math.round(clientes / leads.length * 100) : 0;
      const filas = await Promise.all(cursosL.map(async c => {
        const lecciones = await db.obtenerLecciones(c.id);
        const inscritos = insc.filter(i => i.courseId === c.id && i.status === "active");
        const ventas = aprobados.filter(p => p.courseId === c.id).reduce((s, p) => s + (p.amount || 0), 0);
        const costos = recursosL.filter(r => r.courseId === c.id).reduce((s, r) => s + (Number(r.cost) || 0), 0);
        const avances = inscritos.map(i => lecciones.length ? progreso.filter(p => p.userId === i.userId && p.courseId === c.id).length / lecciones.length : 0);
        const avance = avances.length ? Math.round(avances.reduce((a, b) => a + b, 0) / avances.length * 100) : 0;
        return `<tr><td>${escapar(c.title)}</td><td>${inscritos.length}</td><td>${formatoCOP(ventas)}</td><td>${formatoCOP(costos)}</td><td style="color:${ventas - costos >= 0 ? "var(--exito)" : "var(--error)"}">${formatoCOP(ventas - costos)}</td><td>${avance} %</td></tr>`;
      }));
      panel.innerHTML = `
        <div class="kpis">
          <div class="kpi"><div class="valor">${formatoCOP(ingresos)}</div><div class="nombre">Ingresos (pagos aprobados)</div></div>
          <div class="kpi"><div class="valor">${insc.filter(i => i.status === "active").length}</div><div class="nombre">Inscripciones activas</div></div>
          <div class="kpi"><div class="valor">${leads.length}</div><div class="nombre">Contactos en el CRM</div></div>
          <div class="kpi"><div class="valor">${conversion} %</div><div class="nombre">Conversión (clientes ÷ contactos)</div></div>
        </div>
        <h3 style="margin-top:28px">Por curso</h3>
        <div class="tabla-scroll"><table class="tabla"><thead><tr><th>Curso</th><th>Inscritos</th><th>Ventas</th><th>Costos</th><th>Margen</th><th>Avance promedio</th></tr></thead><tbody>${filas.join("") || '<tr><td colspan="6">Sin cursos</td></tr>'}</tbody></table></div>
        <h3 style="margin-top:28px">Embudo</h3>
        <div class="tabla-scroll"><table class="tabla"><thead><tr><th>Etapa</th><th>Contactos</th></tr></thead><tbody>
          ${["nuevo", "contactado", "interesado", "cliente", "perdido"].map(e => `<tr><td style="text-transform:capitalize">${e}</td><td>${leads.filter(l => l.stage === e).length}</td></tr>`).join("")}
        </tbody></table></div>`;
    }

    /* ================= CURSOS (S3-02) ================= */
    async function cursos() {
      const [lista, instr] = await Promise.all([db.obtenerCursos({ todos: true }), db.obtenerInstructores()]);
      panel.innerHTML = `
        <div class="fila-acciones" style="margin-bottom:16px"><button class="btn btn-primario btn-pequeno" id="nuevo">+ Nuevo curso</button><button class="btn btn-contorno btn-pequeno" id="importar">Importar datos de ejemplo (js/datos.js)</button></div>
        <div class="tabla-scroll"><table class="tabla"><thead><tr><th>Curso</th><th>Categoría</th><th>Precio</th><th>Estado</th><th></th></tr></thead><tbody>
          ${lista.map(c => `<tr><td><strong>${escapar(c.title)}</strong><br><small class="texto-suave">${escapar(c.id)}</small></td><td>${escapar(c.category)}</td><td>${formatoCOP(c.price)}</td><td><span class="chip ${c.published ? "" : "chip-gris"}">${c.published ? "Publicado" : "Oculto"}</span></td><td><button class="btn btn-contorno btn-pequeno" data-editar="${escapar(c.id)}">Editar</button></td></tr>`).join("") || '<tr><td colspan="5">Sin cursos todavía</td></tr>'}
        </tbody></table></div>
        <div id="form-curso"></div>`;
      const formulario = (c = {}) => {
        $("#form-curso").innerHTML = `
          <form class="tarjeta formulario" id="f" style="margin-top:20px">
            <h3>${c.id ? "Editar curso" : "Nuevo curso"}</h3>
            <div class="grid grid-2">
              <div class="campo"><label>Título</label><input name="title" required value="${escapar(c.title || "")}"></div>
              <div class="campo"><label>ID (slug, no cambia después)</label><input name="id" ${c.id ? "readonly" : ""} value="${escapar(c.id || "")}" placeholder="se genera del título"></div>
              <div class="campo"><label>Categoría</label><input name="category" required value="${escapar(c.category || "")}"></div>
              <div class="campo"><label>Nivel</label><select name="level">${["Principiante", "Intermedio", "Avanzado"].map(n => `<option ${c.level === n ? "selected" : ""}>${n}</option>`).join("")}</select></div>
              <div class="campo"><label>Precio (COP)</label><input name="price" type="number" min="0" required value="${c.price ?? ""}"></div>
              <div class="campo"><label>Duración</label><input name="duration" value="${escapar(c.duration || "")}" placeholder="Ej.: 12 horas"></div>
              <div class="campo"><label>Instructor</label><select name="instructorId"><option value="">—</option>${opciones(instr, c.instructorId)}</select></div>
              <div class="campo"><label>Imagen (URL, opcional)</label><input name="imageUrl" value="${escapar(c.imageUrl || "")}"></div>
            </div>
            <div class="campo"><label>Promesa (una frase)</label><input name="promise" value="${escapar(c.promise || "")}"></div>
            <div class="campo"><label>Descripción</label><textarea name="description" rows="3" required>${escapar(c.description || "")}</textarea></div>
            <div class="campo"><label>Qué logra el estudiante (una por línea)</label><textarea name="outcomes" rows="3">${escapar((c.outcomes || []).join("\n"))}</textarea></div>
            <div class="campo"><label>Requisitos (uno por línea)</label><textarea name="requirements" rows="2">${escapar((c.requirements || []).join("\n"))}</textarea></div>
            <label class="campo-check"><input type="checkbox" name="published" ${c.published ? "checked" : ""}> Publicado en el catálogo</label>
            <label class="campo-check"><input type="checkbox" name="featured" ${c.featured ? "checked" : ""}> Destacado en el inicio</label>
            <div class="fila-acciones"><button class="btn btn-primario" type="submit">Guardar</button><button class="btn btn-contorno" type="button" id="cancelar">Cancelar</button></div>
          </form>`;
        $("#cancelar").addEventListener("click", () => $("#form-curso").innerHTML = "");
        $("#f").addEventListener("submit", async (ev) => {
          ev.preventDefault();
          const d = Object.fromEntries(new FormData(ev.target).entries());
          const id = d.id || slug(d.title);
          const lineas = (t) => t.split("\n").map(s => s.trim()).filter(Boolean);
          await db.guardarCurso(id, { title: d.title, category: d.category, level: d.level, price: Number(d.price), duration: d.duration, instructorId: d.instructorId, imageUrl: d.imageUrl, promise: d.promise, description: d.description, outcomes: lineas(d.outcomes), requirements: lineas(d.requirements), published: Boolean(d.published), featured: Boolean(d.featured), currency: "COP" });
          toast("Curso guardado"); cursos();
        });
      };
      $("#nuevo").addEventListener("click", () => formulario());
      $$("[data-editar]").forEach(b => b.addEventListener("click", () => formulario(lista.find(c => c.id === b.dataset.editar))));
      $("#importar").addEventListener("click", async () => {
        if (!confirm("Esto crea o actualiza en Firestore los cursos, lecciones e instructores de js/datos.js. ¿Continuar?")) return;
        for (const i of DATOS.instructors) { const { id, ...r } = i; await db.guardarInstructor(id, r); }
        for (const c of DATOS.courses) { const { id, ...r } = c; await db.guardarCurso(id, r); }
        for (const l of DATOS.lessons) { const { id, ...r } = l; await db.guardarLeccion(id, r); }
        for (const c of DATOS.courses) await db.actualizarTemario(c.id);
        toast("Datos de ejemplo importados"); cursos();
      });
    }

    /* ================= LECCIONES (S3-03) ================= */
    async function lecciones() {
      const cursosL = await db.obtenerCursos({ todos: true });
      const seleccionado = sessionStorage.getItem("admin-curso") || cursosL[0]?.id || "";
      panel.innerHTML = `
        <div class="campo" style="max-width:420px;margin-bottom:16px"><label>Curso</label><select id="sel-curso">${opciones(cursosL, seleccionado)}</select></div>
        <div id="lista-lecciones"></div>`;
      $("#sel-curso").addEventListener("change", (ev) => { sessionStorage.setItem("admin-curso", ev.target.value); pintar(ev.target.value); });
      if (seleccionado) pintar(seleccionado);

      async function pintar(courseId) {
        const ls = await db.obtenerLecciones(courseId);
        $("#lista-lecciones").innerHTML = `
          <div class="fila-acciones" style="margin-bottom:12px"><button class="btn btn-primario btn-pequeno" id="nueva">+ Nueva lección</button></div>
          <div class="tabla-scroll"><table class="tabla"><thead><tr><th>Orden</th><th>Módulo</th><th>Lección</th><th>Video</th><th></th></tr></thead><tbody>
            ${ls.map(l => `<tr><td>${l.order}</td><td>${l.moduleNumber}. ${escapar(l.moduleName)}</td><td>${escapar(l.title)}</td><td>${l.videoUrl ? "✓" : "—"}</td><td class="fila-acciones"><button class="btn btn-contorno btn-pequeno" data-editar="${escapar(l.id)}">Editar</button><button class="btn btn-contorno btn-pequeno" data-borrar="${escapar(l.id)}">Borrar</button></td></tr>`).join("") || '<tr><td colspan="5">Este curso no tiene lecciones</td></tr>'}
          </tbody></table></div>
          <div id="form-leccion"></div>`;
        const formulario = (l = {}) => {
          $("#form-leccion").innerHTML = `
            <form class="tarjeta formulario" id="f" style="margin-top:20px">
              <h3>${l.id ? "Editar lección" : "Nueva lección"}</h3>
              <div class="grid grid-2">
                <div class="campo"><label>Número de módulo</label><input name="moduleNumber" type="number" min="1" required value="${l.moduleNumber ?? (ls.at(-1)?.moduleNumber || 1)}"></div>
                <div class="campo"><label>Nombre del módulo</label><input name="moduleName" required value="${escapar(l.moduleName || ls.at(-1)?.moduleName || "")}"></div>
                <div class="campo"><label>Orden dentro del curso</label><input name="order" type="number" min="1" required value="${l.order ?? ls.length + 1}"></div>
                <div class="campo"><label>Título</label><input name="title" required value="${escapar(l.title || "")}"></div>
                <div class="campo"><label>Video (YouTube no listado o Vimeo)</label><input name="videoUrl" value="${escapar(l.videoUrl || "")}"></div>
                <div class="campo"><label>Material (enlace de Drive)</label><input name="materialUrl" value="${escapar(l.materialUrl || "")}"></div>
              </div>
              <div class="campo"><label>Contenido / texto de la lección</label><textarea name="content" rows="4">${escapar(l.content || "")}</textarea></div>
              <div class="fila-acciones"><button class="btn btn-primario" type="submit">Guardar</button><button class="btn btn-contorno" type="button" id="cancelar">Cancelar</button></div>
            </form>`;
          $("#cancelar").addEventListener("click", () => $("#form-leccion").innerHTML = "");
          $("#f").addEventListener("submit", async (ev) => {
            ev.preventDefault();
            const d = Object.fromEntries(new FormData(ev.target).entries());
            const id = l.id || `${courseId}-${slug(d.title)}`;
            await db.guardarLeccion(id, { courseId, moduleNumber: Number(d.moduleNumber), moduleName: d.moduleName, order: Number(d.order), title: d.title, videoUrl: d.videoUrl, materialUrl: d.materialUrl, content: d.content });
            toast("Lección guardada"); pintar(courseId);
          });
        };
        $("#nueva").addEventListener("click", () => formulario());
        $$("[data-editar]").forEach(b => b.addEventListener("click", () => formulario(ls.find(x => x.id === b.dataset.editar))));
        $$("[data-borrar]").forEach(b => b.addEventListener("click", async () => { if (confirm("¿Borrar esta lección?")) { await db.eliminarLeccion(b.dataset.borrar); pintar(courseId); } }));
      }
    }

    /* ================= CRM (S4-07, S4-08, S4-09) ================= */
    const ETAPAS = ["nuevo", "contactado", "interesado", "cliente", "perdido"];
    async function crm() {
      const [leads, cursosL] = await Promise.all([db.obtenerLeads(), db.obtenerCursos({ todos: true })]);
      const nombreCurso = (id) => cursosL.find(c => c.id === id)?.title || id || "—";
      panel.innerHTML = `
        <div class="pestanas"><button class="pestana activa" data-v="tabla">Contactos</button><button class="pestana" data-v="embudo">Embudo</button></div>
        <div id="crm-tabla">
          <div class="grid grid-4" style="margin-bottom:14px">
            <div class="campo"><label>Buscar</label><input id="buscar" placeholder="nombre o correo"></div>
            <div class="campo"><label>Etapa</label><select id="f-etapa"><option value="">Todas</option>${ETAPAS.map(e => `<option>${e}</option>`).join("")}</select></div>
            <div class="campo"><label>Curso de interés</label><select id="f-curso"><option value="">Todos</option>${opciones(cursosL)}</select></div>
            <div class="campo"><label>Origen</label><select id="f-origen"><option value="">Todos</option>${[...new Set(leads.map(l => l.source).filter(Boolean))].map(s => `<option>${escapar(s)}</option>`).join("")}</select></div>
          </div>
          <div class="tabla-scroll"><table class="tabla"><thead><tr><th>Contacto</th><th>Curso de interés</th><th>Etapa</th><th>Origen</th><th>Fecha</th><th></th></tr></thead><tbody id="filas"></tbody></table></div>
        </div>
        <div id="crm-embudo" class="oculto"><div class="embudo">${ETAPAS.map(e => `<div class="columna-embudo" data-etapa="${e}"><h4 style="text-transform:capitalize">${e} <span id="n-${e}"></span></h4><div id="col-${e}"></div></div>`).join("")}</div></div>
        <div id="detalle-lead"></div>`;
      $$("[data-v]").forEach(b => b.addEventListener("click", () => { $$("[data-v]").forEach(x => x.classList.toggle("activa", x === b)); $("#crm-tabla").classList.toggle("oculto", b.dataset.v !== "tabla"); $("#crm-embudo").classList.toggle("oculto", b.dataset.v !== "embudo"); }));

      function pintarTabla() {
        const q = $("#buscar").value.toLowerCase(), et = $("#f-etapa").value, cu = $("#f-curso").value, or = $("#f-origen").value;
        const lista = leads.filter(l => (!q || (l.name + l.email).toLowerCase().includes(q)) && (!et || l.stage === et) && (!cu || l.courseInterest === cu) && (!or || l.source === or));
        $("#filas").innerHTML = lista.map(l => `<tr><td><strong>${escapar(l.name)}</strong><br><small>${escapar(l.email)}${l.phone ? " · " + escapar(l.phone) : ""}</small></td><td>${escapar(nombreCurso(l.courseInterest))}</td><td><span class="chip ${l.stage === "cliente" ? "" : "chip-gris"}">${escapar(l.stage)}</span></td><td>${escapar(l.source || "")}</td><td>${fechaCorta(l.createdAt)}</td><td><button class="btn btn-contorno btn-pequeno" data-lead="${l.id}">Seguimiento</button></td></tr>`).join("") || '<tr><td colspan="6">Sin contactos</td></tr>';
        $$("[data-lead]").forEach(b => b.addEventListener("click", () => detalle(leads.find(l => l.id === b.dataset.lead))));
      }
      function pintarEmbudo() {
        for (const e of ETAPAS) {
          const col = leads.filter(l => l.stage === e);
          $(`#n-${e}`).textContent = col.length;
          $(`#col-${e}`).innerHTML = col.map(l => `<div class="tarjeta-lead"><strong>${escapar(l.name)}</strong><br><small>${escapar(nombreCurso(l.courseInterest))}</small><select data-mover="${l.id}">${ETAPAS.map(x => `<option ${x === l.stage ? "selected" : ""}>${x}</option>`).join("")}</select></div>`).join("");
        }
        $$("[data-mover]").forEach(s => s.addEventListener("change", async () => { await db.actualizarLead(s.dataset.mover, { stage: s.value }); leads.find(l => l.id === s.dataset.mover).stage = s.value; pintarEmbudo(); pintarTabla(); toast("Etapa actualizada"); }));
      }
      async function detalle(l) {
        const inter = await db.obtenerInteracciones(l.id);
        $("#detalle-lead").innerHTML = `
          <div class="tarjeta" style="margin-top:20px">
            <h3>${escapar(l.name)} <small class="texto-suave">· ${escapar(l.email)}</small></h3>
            <div class="grid grid-2">
              <div>
                <h4>Nueva interacción</h4>
                <form class="formulario" id="f-inter">
                  <div class="campo"><label>Canal</label><select name="channel"><option>WhatsApp</option><option>Correo</option><option>Llamada</option><option>Presencial</option></select></div>
                  <div class="campo"><label>Nota (qué se habló)</label><textarea name="note" rows="2" required></textarea></div>
                  <div class="campo"><label>Próxima acción</label><input name="nextAction" placeholder="Ej.: enviar descuento"></div>
                  <div class="campo"><label>Fecha de la próxima acción</label><input name="nextActionDate" type="date"></div>
                  <div class="campo"><label>Etapa</label><select name="stage">${ETAPAS.map(x => `<option ${x === l.stage ? "selected" : ""}>${x}</option>`).join("")}</select></div>
                  <button class="btn btn-primario btn-pequeno" type="submit">Guardar</button>
                </form>
              </div>
              <div>
                <h4>Historial</h4>
                ${inter.map(i => `<div class="tarjeta-lead"><strong>${escapar(i.channel)}</strong> · ${fechaCorta(i.date)}<br>${escapar(i.note)}${i.nextAction ? `<br><small>➡ ${escapar(i.nextAction)} (${escapar(i.nextActionDate || "sin fecha")})</small>` : ""}</div>`).join("") || '<p class="texto-suave">Sin interacciones aún.</p>'}
              </div>
            </div>
          </div>`;
        $("#detalle-lead").scrollIntoView({ behavior: "smooth" });
        $("#f-inter").addEventListener("submit", async (ev) => {
          ev.preventDefault();
          const d = Object.fromEntries(new FormData(ev.target).entries());
          await db.agregarInteraccion(l.id, { channel: d.channel, note: d.note, nextAction: d.nextAction, nextActionDate: d.nextActionDate });
          if (d.stage !== l.stage) { await db.actualizarLead(l.id, { stage: d.stage }); l.stage = d.stage; }
          toast("Interacción guardada"); pintarTabla(); pintarEmbudo(); detalle(l);
        });
      }
      ["#buscar", "#f-etapa", "#f-curso", "#f-origen"].forEach(s => $(s).addEventListener("input", pintarTabla));
      pintarTabla(); pintarEmbudo();
    }

    /* ================= INSCRIPCIONES (S3-07) ================= */
    async function inscripciones() {
      const [insc, usuarios, cursosL] = await Promise.all([db.obtenerInscripciones(), db.obtenerUsuarios(), db.obtenerCursos({ todos: true })]);
      const nombreU = (uid) => usuarios.find(u => u.uid === uid)?.email || uid;
      const nombreC = (id) => cursosL.find(c => c.id === id)?.title || id;
      panel.innerHTML = `
        <form class="tarjeta formulario" id="f" style="margin-bottom:20px">
          <h3>Inscripción manual (para pruebas o ventas por fuera)</h3>
          <div class="grid grid-2">
            <div class="campo"><label>Usuario</label><select name="uid" required>${opciones(usuarios, "", u => `${u.email} (${u.name || ""})`)}</select></div>
            <div class="campo"><label>Curso</label><select name="courseId" required>${opciones(cursosL)}</select></div>
          </div>
          <button class="btn btn-primario" type="submit">Inscribir</button>
        </form>
        <div class="tabla-scroll"><table class="tabla"><thead><tr><th>Usuario</th><th>Curso</th><th>Estado</th><th>Pago</th><th>Fecha</th></tr></thead><tbody>
          ${insc.map(i => `<tr><td>${escapar(nombreU(i.userId))}</td><td>${escapar(nombreC(i.courseId))}</td><td><span class="chip ${i.status === "active" ? "" : "chip-gris"}">${escapar(i.status)}</span></td><td>${escapar(i.paymentId || "")}</td><td>${fechaCorta(i.createdAt)}</td></tr>`).join("") || '<tr><td colspan="5">Sin inscripciones</td></tr>'}
        </tbody></table></div>`;
      $("#f").addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const d = Object.fromEntries(new FormData(ev.target).entries());
        await db.inscribirManual(d.uid, d.courseId, 0); toast("Inscripción creada"); inscripciones();
      });
    }

    /* ================= INSTRUCTORES (S5-01) ================= */
    async function instructores() {
      const lista = await db.obtenerInstructores();
      panel.innerHTML = `
        <div class="grid grid-2">
          <div class="tabla-scroll"><table class="tabla"><thead><tr><th>Nombre</th><th>Especialidad</th><th>Tarifa/hora</th><th></th></tr></thead><tbody>
            ${lista.map(i => `<tr><td>${escapar(i.name)}<br><small>${escapar(i.email || "")}</small></td><td>${escapar(i.specialty || "")}</td><td>${formatoCOP(i.hourlyRate)}</td><td><button class="btn btn-contorno btn-pequeno" data-editar="${escapar(i.id)}">Editar</button></td></tr>`).join("") || '<tr><td colspan="4">Sin instructores</td></tr>'}
          </tbody></table></div>
          <form class="tarjeta formulario" id="f"><h3 id="titulo-f">Nuevo instructor</h3>
            <input type="hidden" name="id">
            <div class="campo"><label>Nombre</label><input name="name" required></div>
            <div class="campo"><label>Correo</label><input name="email" type="email"></div>
            <div class="campo"><label>Especialidad</label><input name="specialty"></div>
            <div class="campo"><label>Tarifa por hora (COP)</label><input name="hourlyRate" type="number" min="0" value="0"></div>
            <div class="campo"><label>Biografía corta</label><textarea name="bio" rows="3"></textarea></div>
            <div class="fila-acciones"><button class="btn btn-primario" type="submit">Guardar</button><button class="btn btn-contorno" type="reset">Limpiar</button></div>
          </form>
        </div>`;
      const f = $("#f");
      $$("[data-editar]").forEach(b => b.addEventListener("click", () => { const i = lista.find(x => x.id === b.dataset.editar); for (const k of ["id", "name", "email", "specialty", "hourlyRate", "bio"]) f[k].value = i[k] ?? ""; $("#titulo-f").textContent = "Editar instructor"; }));
      f.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const d = Object.fromEntries(new FormData(f).entries());
        await db.guardarInstructor(d.id || slug(d.name), { name: d.name, email: d.email, specialty: d.specialty, hourlyRate: Number(d.hourlyRate), bio: d.bio });
        toast("Instructor guardado"); instructores();
      });
    }

    /* ================= RECURSOS Y COSTOS (S5-02) ================= */
    async function recursos() {
      const [lista, cursosL, instr] = await Promise.all([db.obtenerRecursos(), db.obtenerCursos({ todos: true }), db.obtenerInstructores()]);
      const nombreC = (id) => cursosL.find(c => c.id === id)?.title || id;
      const TIPOS = ["video", "material", "licencia", "horario", "instructor", "otro"];
      panel.innerHTML = `
        <form class="tarjeta formulario" id="f" style="margin-bottom:20px"><h3>Nuevo recurso</h3>
          <div class="grid grid-3">
            <div class="campo"><label>Curso</label><select name="courseId" required>${opciones(cursosL)}</select></div>
            <div class="campo"><label>Tipo</label><select name="type">${TIPOS.map(t => `<option>${t}</option>`).join("")}</select></div>
            <div class="campo"><label>Nombre</label><input name="name" required placeholder="Ej.: Grabación módulo 1"></div>
            <div class="campo"><label>Costo (COP)</label><input name="cost" type="number" min="0" value="0"></div>
            <div class="campo"><label>Responsable</label><input name="responsible" list="lista-instr"><datalist id="lista-instr">${instr.map(i => `<option value="${escapar(i.name)}">`).join("")}</datalist></div>
            <div class="campo"><label>Estado</label><select name="status"><option>pendiente</option><option>en progreso</option><option>listo</option></select></div>
            <div class="campo"><label>Enlace (Drive/YouTube)</label><input name="link"></div>
            <div class="campo"><label>Fecha / horario</label><input name="schedule" placeholder="Ej.: lunes 7 pm"></div>
          </div>
          <button class="btn btn-primario" type="submit">Agregar</button>
        </form>
        <div class="tabla-scroll"><table class="tabla"><thead><tr><th>Curso</th><th>Tipo</th><th>Recurso</th><th>Costo</th><th>Responsable</th><th>Estado</th><th></th></tr></thead><tbody>
          ${lista.map(r => `<tr><td>${escapar(nombreC(r.courseId))}</td><td>${escapar(r.type)}</td><td>${escapar(r.name)}${r.link ? ` <a href="${escapar(r.link)}" target="_blank">↗</a>` : ""}${r.schedule ? `<br><small>${escapar(r.schedule)}</small>` : ""}</td><td>${formatoCOP(r.cost)}</td><td>${escapar(r.responsible || "")}</td><td><select data-estado="${r.id}">${["pendiente", "en progreso", "listo"].map(s => `<option ${s === r.status ? "selected" : ""}>${s}</option>`).join("")}</select></td><td><button class="btn btn-contorno btn-pequeno" data-borrar="${r.id}">Borrar</button></td></tr>`).join("") || '<tr><td colspan="7">Sin recursos registrados</td></tr>'}
        </tbody></table></div>
        <p class="texto-suave" style="margin-top:10px">Total de costos registrados: <strong>${formatoCOP(lista.reduce((s, r) => s + (Number(r.cost) || 0), 0))}</strong></p>`;
      $("#f").addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const d = Object.fromEntries(new FormData(ev.target).entries());
        await db.guardarRecurso(null, { ...d, cost: Number(d.cost) }); toast("Recurso agregado"); recursos();
      });
      $$("[data-estado]").forEach(s => s.addEventListener("change", async () => { await db.guardarRecurso(s.dataset.estado, { status: s.value }); toast("Estado actualizado"); }));
      $$("[data-borrar]").forEach(b => b.addEventListener("click", async () => { if (confirm("¿Borrar el recurso?")) { await db.eliminarRecurso(b.dataset.borrar); recursos(); } }));
    }

    /* ================= CALENDARIO DE SESIONES (S5-03) ================= */
    const DIAS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    async function calendario() {
      const [sesiones, cursosL, instr] = await Promise.all([db.obtenerSesiones(), db.obtenerCursos({ todos: true }), db.obtenerInstructores()]);
      const nombreC = (id) => cursosL.find(c => c.id === id)?.title || id || "—";
      const nombreI = (id) => instr.find(i => i.id === id)?.name || "Sin instructor";
      const tarjeta = (s) => `
        <div class="tarjeta-lead">
          <strong>${escapar(s.startTime)}–${escapar(s.endTime)}</strong> · <span class="chip chip-gris">${escapar(s.mode || "en vivo")}</span><br>
          ${escapar(s.title || nombreC(s.courseId))}<br>
          <small class="texto-suave">${escapar(nombreC(s.courseId))} · ${escapar(nombreI(s.instructorId))}</small>
          ${s.link ? `<br><a href="${escapar(s.link)}" target="_blank" rel="noopener">Enlace de la sesión ↗</a>` : ""}
          <div class="fila-acciones" style="margin-top:6px"><button class="btn btn-contorno btn-pequeno" data-editar="${s.id}">Editar</button><button class="btn btn-contorno btn-pequeno" data-borrar="${s.id}">Borrar</button></div>
        </div>`;
      panel.innerHTML = `
        <p class="texto-suave">Vista semanal de sesiones en vivo, asesorías y grabaciones. Cada sesión tiene curso, instructor, día y hora.</p>
        <div class="fila-acciones" style="margin-bottom:14px"><button class="btn btn-primario btn-pequeno" id="nueva">+ Nueva sesión</button></div>
        <div class="embudo" style="grid-template-columns:repeat(7, minmax(160px, 1fr))">
          ${[1, 2, 3, 4, 5, 6, 7].map(d => `<div class="columna-embudo"><h4>${DIAS[d]} <span>${sesiones.filter(s => Number(s.dayOfWeek) === d).length}</span></h4>${sesiones.filter(s => Number(s.dayOfWeek) === d).map(tarjeta).join("") || '<p class="texto-suave" style="font-size:.8rem;margin:4px 6px">Sin sesiones</p>'}</div>`).join("")}
        </div>
        <div id="form-sesion"></div>`;
      const formulario = (s = {}) => {
        $("#form-sesion").innerHTML = `
          <form class="tarjeta formulario" id="f" style="margin-top:20px">
            <h3>${s.id ? "Editar sesión" : "Nueva sesión"}</h3>
            <div class="grid grid-3">
              <div class="campo"><label>Curso</label><select name="courseId" required>${opciones(cursosL, s.courseId)}</select></div>
              <div class="campo"><label>Instructor</label><select name="instructorId"><option value="">—</option>${opciones(instr, s.instructorId)}</select></div>
              <div class="campo"><label>Título (opcional)</label><input name="title" value="${escapar(s.title || "")}" placeholder="Ej.: Asesoría módulo 2"></div>
              <div class="campo"><label>Día</label><select name="dayOfWeek">${[1, 2, 3, 4, 5, 6, 7].map(d => `<option value="${d}" ${Number(s.dayOfWeek) === d ? "selected" : ""}>${DIAS[d]}</option>`).join("")}</select></div>
              <div class="campo"><label>Hora inicio</label><input name="startTime" type="time" required value="${escapar(s.startTime || "19:00")}"></div>
              <div class="campo"><label>Hora fin</label><input name="endTime" type="time" required value="${escapar(s.endTime || "20:30")}"></div>
              <div class="campo"><label>Modalidad</label><select name="mode">${["en vivo", "asesoría", "grabación", "presencial"].map(m => `<option ${s.mode === m ? "selected" : ""}>${m}</option>`).join("")}</select></div>
              <div class="campo"><label>Enlace (Meet/Zoom)</label><input name="link" value="${escapar(s.link || "")}"></div>
              <div class="campo"><label>Notas</label><input name="notes" value="${escapar(s.notes || "")}"></div>
            </div>
            <div class="fila-acciones"><button class="btn btn-primario" type="submit">Guardar</button><button class="btn btn-contorno" type="button" id="cancelar">Cancelar</button></div>
          </form>`;
        $("#cancelar").addEventListener("click", () => $("#form-sesion").innerHTML = "");
        $("#f").addEventListener("submit", async (ev) => {
          ev.preventDefault();
          const d = Object.fromEntries(new FormData(ev.target).entries());
          await db.guardarSesion(s.id || null, { ...d, dayOfWeek: Number(d.dayOfWeek) });
          toast("Sesión guardada"); calendario();
        });
      };
      $("#nueva").addEventListener("click", () => formulario());
      $$("[data-editar]").forEach(b => b.addEventListener("click", () => formulario(sesiones.find(x => x.id === b.dataset.editar))));
      $$("[data-borrar]").forEach(b => b.addEventListener("click", async () => { if (confirm("¿Borrar la sesión?")) { await db.eliminarSesion(b.dataset.borrar); calendario(); } }));
    }

    /* ================= USUARIOS (S2-09) ================= */
    async function usuarios() {
      const lista = await db.obtenerUsuarios();
      panel.innerHTML = `
        <p class="texto-suave">Cambia el rol para dar acceso al panel. Hay ${lista.length} usuarios registrados.</p>
        <div class="tabla-scroll"><table class="tabla"><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Registro</th></tr></thead><tbody>
          ${lista.map(u => `<tr><td>${escapar(u.name || "")}</td><td>${escapar(u.email)}</td><td><select data-rol="${u.uid}" ${u.uid === usuario.uid ? "disabled" : ""}><option value="student" ${u.role === "student" ? "selected" : ""}>Estudiante</option><option value="admin" ${u.role === "admin" ? "selected" : ""}>Administrador</option></select></td><td>${fechaCorta(u.createdAt)}</td></tr>`).join("")}
        </tbody></table></div>`;
      $$("[data-rol]").forEach(s => s.addEventListener("change", async () => { await db.cambiarRol(s.dataset.rol, s.value); toast("Rol actualizado"); }));
    }
  }
}
