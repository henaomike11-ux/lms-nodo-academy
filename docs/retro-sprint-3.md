# Acta de revisión y retrospectiva · Sprint 3 · Aula virtual

**Fecha de la demo:** por programar en clase · **Retrospectiva redactada:** 4 nov 2026 (propuesta de la IA a partir de lo ocurrido en el sprint; el equipo puede ajustarla) · **Enlace:** https://henaomike11-ux.github.io/lms-nodo-academy/

## Revisión (qué se demostró)

- [x] Panel admin: crear/editar cursos y lecciones (orden por módulo).
- [x] Pantalla de lección con video, texto, material y navegación anterior/siguiente.
- [x] Marcar lección como completada → barra de progreso en Mis cursos (persiste al volver a entrar).
- [x] Inscripción manual desde el panel para pruebas.
- [x] Reglas: un usuario sin inscripción no puede leer las lecciones aunque copie el enlace.
- [ ] Videos y materiales reales cargados en cada lección (S3-01).

## Retrospectiva

| Mantener | Mejorar | Probar |
|---|---|---|
| Ids predecibles (`uid_courseId`, `uid_lessonId`): evitaron duplicados en inscripciones y progreso sin lógica extra. | El contenido real (videos y materiales) llegó tarde: el aula funciona, pero las lecciones muestran «video en producción». Grabar contenido en paralelo al desarrollo, no después. | Que un integrante distinto al que construyó cada pantalla la pruebe en su celular antes de moverla a «Hecho» (definición de hecho). |
