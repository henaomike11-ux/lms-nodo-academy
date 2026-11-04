# Nodo Academy · Plataforma de cursos (LMS + CRM) con IA

Proyecto del semestre · E-Business · Diseño Digital.
Plataforma web donde **Nodo Academy** publica y vende cursos de tecnología para principiantes, dicta las lecciones en un aula virtual, registra a sus clientes en un CRM y organiza los recursos de cada curso.

🔗 **Sitio publicado:** https://henaomike11-ux.github.io/lms-nodo-academy/

## Qué hace

| Módulo | Pantallas | Estado |
|---|---|---|
| Sitio público | Inicio, catálogo, detalle del curso, legales | ✅ Sprint 1 |
| Usuarios | Registro, inicio de sesión (correo y Google), perfil | ✅ Sprint 2 |
| Aula virtual (LMS) | Mis cursos, lección con video y avance, panel admin de cursos y lecciones | 🔧 Sprint 3 |
| Pagos y paywall | Botón Comprar → Wompi → evento (webhook) → inscripción automática | 🔧 Sprint 4 |
| CRM | Formulario de interés → contactos, embudo, notas de seguimiento | 🔧 Sprint 4 |
| Recursos y reportes | Instructores, recursos y costos, ventas, conversión y margen | 🔧 Sprint 5 |

## Ruta tecnológica (Ruta A)

- **Frontend:** HTML, CSS y JavaScript puro (módulos ES), publicado en GitHub Pages.
- **Usuarios y datos:** Firebase Authentication + Cloud Firestore (plan Spark, gratis).
- **Backend:** Google Apps Script (`/backend/Code.gs`): crea el cobro, recibe el webhook de la pasarela, escribe la inscripción y envía correos.
- **Pasarela:** Wompi (Web Checkout) en sandbox.
- **IA:** Claude como asistente de desarrollo (ver `docs/bitacora-ia.md`).

## Cómo correrlo

1. Clona el repositorio o descárgalo.
2. Abre la carpeta con un servidor local (por ejemplo la extensión *Live Server* de VS Code) o simplemente publícalo en GitHub Pages. *No abras los archivos con doble clic:* los módulos de JavaScript necesitan `http://`.
3. Sin Firebase configurado el sitio funciona en **modo demo** con los datos de `js/datos.js`.
4. Para activar usuarios y base de datos: pega el bloque `firebaseConfig` en `js/firebase-config.js`, publica `firestore.rules` en Firestore y entra al panel (`admin.html`) → Cursos → *Importar datos de ejemplo*.

## Estructura

```
index.html  cursos.html  curso.html  login.html  mis-cursos.html  leccion.html  perfil.html  pago.html  admin.html  legales.html
css/estilos.css          guía de estilo de la marca
js/app.js                header, footer y utilidades comunes
js/db.js                 capa de datos: Firestore o modo demo
js/datos.js              inventario de cursos (datos de ejemplo)
js/firebase-config.js    configuración pública de Firebase y URL del backend
js/*.js                  un archivo por pantalla
backend/Code.gs          Apps Script: pagos, webhook y correos
firestore.rules          reglas de seguridad
docs/                    equipo, cursos, mapa del sitio, bitácora de IA, actas de sprint
CONTEXTO.md              memoria del proyecto para la IA
```

## Equipo

| Integrante | Rol |
|---|---|
| Mike Henao | Product Owner |
| Juan Oduber | Scrum Master |
| Jose García | Developer |

Trabajamos con Scrum simplificado: 6 sprints, tablero en GitHub Projects, un Issue por tarea del backlog. Ver `docs/equipo.md`.

## Seguridad

- Ninguna clave secreta vive en este repositorio: el token de la pasarela va solo en Propiedades del script de Apps Script.
- La configuración de Firebase en `js/firebase-config.js` es pública por diseño; la protección la dan las reglas de `firestore.rules`.
- Solo los usuarios con `role: "admin"` entran al panel; las reglas lo verifican también en el servidor.
