# Acta de revisión y retrospectiva · Sprint 2 · Usuarios y datos

**Fecha de la demo:** por programar en clase · **Retrospectiva redactada:** 4 nov 2026 (propuesta de la IA a partir de lo ocurrido en el sprint; el equipo puede ajustarla) · **Enlace:** https://henaomike11-ux.github.io/lms-nodo-academy/

## Revisión (qué se demostró)

- [x] Registro e inicio de sesión con correo y con Google; el header cambia con la sesión.
- [x] Catálogo y detalle del curso leyendo desde Firestore (2 cursos, 18 lecciones, 2 instructores).
- [x] Formulario "Quiero más información" crea el contacto en `leads` con etapa *nuevo*.
- [x] Reglas de seguridad publicadas; rol administrador creado y `admin.html` protegido.

## Retrospectiva

| Mantener | Mejorar | Probar |
|---|---|---|
| El botón «Importar datos de ejemplo» del panel: cargar 2 cursos y 18 lecciones tomó un clic en vez de escribirlos a mano en la consola. | La caché del navegador nos hizo creer que un cambio no funcionaba (admin.js viejo): acordar recargar con Ctrl+Shift+R y versionar los scripts (`?v=`) al desplegar. | Pensar las reglas de seguridad **junto con** el modelo de datos: la regla «solo inscritos leen lecciones» obligó a crear el temario público (`syllabus`) a mitad del sprint. |
