# Revisión de seguridad · S5-08

**Fecha:** 4 de noviembre de 2026 · **Responsable:** Datos y backend (con apoyo de la IA)

## Lista de verificación

| # | Control | Estado | Evidencia |
|---|---|---|---|
| 1 | Ninguna clave secreta en GitHub (código ni historial) | ✅ | Búsqueda de patrones `prv_`, `integrity_`, `events_`, llaves privadas y contraseñas en todos los archivos y en `git log -p`: sin coincidencias reales (la única es el secreto *de ejemplo* de la documentación pública de Wompi usado para probar el SHA256). |
| 2 | Secretos solo en Propiedades del script de Apps Script | ✅ | `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET` viven en Apps Script; el código los lee con `cfg()` y nunca los devuelve al frontend. |
| 3 | La configuración de Firebase en `js/firebase-config.js` es pública por diseño | ✅ | apiKey/projectId/appId identifican el proyecto; no dan permisos. La protección está en las reglas. |
| 4 | Reglas de Firestore activas (no modo prueba) | ✅ | `firestore.rules` publicadas: `users` solo propio/admin; `courses` lectura pública solo si `published`; `lessons` solo inscritos; `enrollments`/`payments` solo backend y admin; `leads` creación pública validada (consent = true, stage = nuevo, tamaños máximos), lectura solo admin. |
| 5 | Un estudiante no puede cambiar su propio rol | ✅ | Regla `update` en `users` exige `request.resource.data.role == resource.data.role` salvo admin. |
| 6 | Panel de administración protegido | ✅ | `requerirAdmin()` en `admin.js` redirige a quien no es admin, y las reglas verifican `role == 'admin'` del lado del servidor en cada lectura/escritura. |
| 7 | Paywall real, no solo visual | ✅ | `lessons` solo se puede leer con inscripción activa (`inscrito(courseId)`); el temario público vive en `courses.syllabus` sin contenido. |
| 8 | El webhook de pagos no confía en el aviso | ✅ | Verifica el checksum con el secreto de eventos y luego **consulta la transacción** a Wompi antes de crear la inscripción. |
| 9 | La firma de integridad se calcula en el servidor | ✅ | `crearPago` en Apps Script; el frontend nunca ve el secreto. |
| 10 | Inscripciones y pagos con id predecible (sin duplicados) | ✅ | `enrollments/{uid}_{courseId}`, `payments/{referencia}`. |
| 11 | Dominio de GitHub Pages autorizado en Firebase Auth | ✅ | `henaomike11-ux.github.io` en Dominios autorizados. |
| 12 | HTTPS en todo el sitio | ✅ | GitHub Pages fuerza HTTPS. |
| 13 | Formularios validan en el cliente y en las reglas | ✅ | Nombre ≥ 3, correo válido, consentimiento obligatorio; las reglas rechazan `leads` sin consentimiento. |
| 14 | Cuentas con 2 pasos | ⚠️ | Recomendado para GitHub, Google y Wompi del equipo. Pendiente de activar. |

## Riesgos aceptados y recomendaciones

- **Claves de sandbox:** al pasar a producción, generar llaves `prod_` en Wompi, cambiar `WOMPI_ENV=production`, publicar nueva versión del script y configurar la URL de eventos del modo producción.
- **Acceso al panel:** solo Mike Henao es admin. Para dar acceso a otro integrante, cambiar su rol desde Panel → Usuarios (nunca desde el frontend sin sesión admin).
- **Apps Script "Cualquier usuario":** necesario para que Wompi llame al webhook. El script valida el checksum y consulta a Wompi, por lo que un POST falso no crea inscripciones.
- **Copias de seguridad:** Firestore en plan Spark no tiene backups automáticos; exportar periódicamente los cursos y leads desde el panel (o Firebase → Importar/Exportar).
- **Datos personales:** se recogen solo los necesarios (nombre, correo, teléfono opcional) con autorización explícita (Ley 1581 de 2012). Los datos de tarjeta nunca pasan por la plataforma: los procesa Wompi.
