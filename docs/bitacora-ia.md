# Bitácora de IA

Registro de los prompts clave de cada sprint: qué pedimos, con qué herramienta, qué salió y qué tuvimos que corregir. Es evidencia de cómo desarrollamos con IA (criterio "Desarrollo con IA", 15 % de la nota).

## Sprint 0 y 1

| # | Fecha | Quién | Herramienta | Qué pedimos | Resultado | Correcciones |
|---|---|---|---|---|---|---|
| 1 | 2026-11-03 | Mike | Claude | Leer la guía, la presentación, el backlog y el documento de marca, y proponer qué cuentas y accesos hacen falta para empezar | Lista de accesos por sprint (GitHub primero, Firebase en el Sprint 2, Apps Script y pasarela en el Sprint 4) | Ninguna |
| 2 | 2026-11-03 | Mike | Claude | Crear la estructura del repositorio, la guía de estilo (`css/estilos.css`) con los colores y tipografías de la marca y los datos de ejemplo de los 2 cursos | Carpetas `/css /js /img /backend /docs`, variables CSS de la marca, `js/datos.js` con 2 cursos, 18 lecciones y 2 instructores | Instructores marcados como "ejemplo" hasta tener los reales (regla de contenido honesto) |
| 3 | 2026-11-03 | Mike | Claude | Construir inicio, catálogo con filtro por categoría y detalle del curso, celular primero, sin frameworks | Las tres pantallas funcionan leyendo de `js/datos.js`; el formulario de interés valida nombre, correo y casilla de autorización | Pendiente probar en celular real |
| 4 | 2026-11-03 | Mike | Claude | Diseñar la capa de datos (`js/db.js`) para que las páginas funcionen igual con datos de ejemplo hoy y con Firestore en el Sprint 2 | Un solo archivo con todas las lecturas/escrituras; cambia de modo solo con pegar `firebaseConfig` | — |
| 5 | 2026-11-03 | Mike | Claude | Escribir las reglas de Firestore según el modelo de datos de la sección 8 y el `Code.gs` del backend de pagos con Mercado Pago | `firestore.rules` y `backend/Code.gs` listos para usar en los sprints 2 y 4 | Revisar cuando se elija la pasarela definitiva |

## Sprint 2

| # | Fecha | Quién | Herramienta | Qué pedimos | Resultado | Correcciones |
|---|---|---|---|---|---|---|
| 6 | 2026-11-03 | Mike | Claude | Crear el proyecto en Firebase, registrar la app web, activar Authentication (correo y Google), autorizar el dominio de GitHub Pages y crear Firestore con las reglas de `firestore.rules` | Proyecto `nodo-academy-bc8b2` operando; el sitio dejó el modo demo y lee de Firestore | La aceptación de condiciones de Firebase y el registro del primer usuario los hizo Mike a mano (la IA no acepta términos ni crea cuentas en nombre del equipo) |
| 7 | 2026-11-03 | Mike | Claude | Cargar los cursos del inventario a Firestore sin escribirlos a mano | Botón «Importar datos de ejemplo» en el panel admin: sube cursos, lecciones e instructores desde `js/datos.js` | Hubo que correr la importación dos veces porque el navegador tenía en caché la versión anterior de `admin.js` |
| 8 | 2026-11-03 | Mike | Claude | El detalle del curso mostraba «El temario se publicará pronto» para visitantes | Causa: las reglas solo dejan leer `lessons` a inscritos (correcto para el paywall). Solución: el curso guarda una copia pública del temario (`courses.syllabus`, solo títulos) que se recalcula al guardar o borrar lecciones | Buen ejemplo de que la seguridad obliga a decidir qué datos son públicos y cuáles no |
| 9 | 2026-11-03 | Mike | Claude | Probar el flujo completo del aula | Inscripción manual → Mis cursos → lección → «Marcar como completada» → barra de progreso al 11 % | Ninguna. El formulario de interés también creó un contacto en `leads` respetando las reglas |

## Sprint 3

*(por llenar)*
