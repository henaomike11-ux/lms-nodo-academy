# Contexto del proyecto · Nodo Academy

> Pega este archivo al inicio de cada conversación con la IA. Actualízalo al final de cada sprint.

- **Emprendimiento:** Nodo Academy — vende cursos en línea de tecnología y desarrollo web para principiantes, con acceso de por vida y certificado de finalización.
- **Cursos:**
  - Desarrollo Web desde Cero — $149.000 COP — 3 módulos (HTML, CSS y diseño, JavaScript básico), 9 lecciones.
  - Git y GitHub para Equipos — $99.000 COP — 3 módulos (Introducción a Git, Trabajo con GitHub, Flujo Scrum con GitHub), 9 lecciones.
- **Ruta tecnológica (Ruta A):** HTML, CSS y JavaScript puro (módulos ES, sin frameworks) + Firebase Authentication + Cloud Firestore + Google Apps Script (backend de pagos y correos) + pasarela de pago Mercado Pago (modo prueba).
- **Publicación:** GitHub Pages en https://henaomike11-ux.github.io/lms-nodo-academy/
- **Marca:** primario `#3B4CCA` (azul índigo), secundario `#18C3B0` (turquesa), acento `#FFC83D` (amarillo), fondo `#F7F8FC`, texto `#1E2233`. Tipografías: Poppins (títulos) e Inter (texto). Tono: cercano y claro, en español, tuteo.
- **Estructura de carpetas:**
  - `/index.html` inicio · `/cursos.html` catálogo · `/curso.html?id=` detalle · `/login.html` registro e inicio de sesión · `/mis-cursos.html` panel del estudiante · `/leccion.html?curso=&leccion=` aula · `/perfil.html` · `/pago.html` · `/admin.html` panel administrador · `/legales.html`
  - `/css/estilos.css` guía de estilo (variables CSS de la marca)
  - `/js/app.js` header, footer y utilidades · `/js/db.js` capa de datos (Firestore o modo demo) · `/js/datos.js` datos de ejemplo · `/js/firebase-config.js` configuración pública · un `.js` por pantalla
  - `/backend/Code.gs` Apps Script (pagos, webhook, correos) · `/firestore.rules` reglas de seguridad
  - `/docs` actas, inventario de cursos, bitácora de IA, mapa del sitio
- **Modelo de datos (Firestore):** `users`, `courses`, `lessons`, `enrollments` (id = `uid_courseId`), `progress` (id = `uid_lessonId`), `payments`, `leads`, `interactions`, `instructors`, `resources`. Ver sección 8 de la guía.
- **Modo demo:** si `js/firebase-config.js` está vacío, `db.js` lee de `js/datos.js` y el login queda deshabilitado. Al pegar la configuración de Firebase, todo pasa a usar la base de datos sin cambiar las páginas.
- **Ya funciona:** sitio público (inicio, catálogo, detalle, legales), registro e inicio de sesión (correo y Google), catálogo y detalle desde Firestore, formulario que crea leads, panel admin (cursos, lecciones, CRM, inscripciones, instructores, recursos, reportes, usuarios), aula con progreso. Cuenta admin: Mike Henao.
- **Estamos trabajando en:** Sprint 3 — aula virtual: subir videos (YouTube no listado) y materiales (Drive) a cada lección desde el panel; probar con un estudiante real; reglas de lecciones ya activas.
- **Reglas para la IA:** responde en español; explica cada archivo que crees; no uses librerías ni frameworks sin preguntar; diseño celular primero con los colores de la marca; nunca pongas claves secretas en el código; entrega archivos completos, no fragmentos.
