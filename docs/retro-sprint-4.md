# Acta de revisión y retrospectiva · Sprint 4 · Pagos y CRM

**Fecha de la demo:** por programar en clase · **Retrospectiva redactada:** 4 nov 2026 (propuesta de la IA a partir de lo ocurrido en el sprint; el equipo puede ajustarla) · **Enlace:** https://henaomike11-ux.github.io/lms-nodo-academy/

## Revisión (qué se demostró)

- [x] Compra de prueba con Wompi (sandbox): botón Comprar → checkout → evento → inscripción automática → el curso abre solo.
- [x] El contacto del comprador pasa a etapa *cliente* en el CRM.
- [x] CRM: tabla con búsqueda y filtros, embudo por etapas y notas de seguimiento.
- [x] Correo automático de bienvenida a nuevos contactos (Apps Script).
- [x] Incidente resuelto: secretos de integridad y eventos intercambiados → función `diagnosticarLlaves`.

## Retrospectiva

| Mantener | Mejorar | Probar |
|---|---|---|
| Nunca confiar solo en el aviso de la pasarela: verificar el checksum y consultar la transacción antes de inscribir. Dio seguridad real con poco código. | Al pegar llaves a mano los secretos quedaron cruzados y la firma falló. Correr siempre `diagnosticarLlaves` (muestra prefijo y longitud, no el valor) justo después de configurar. | Pedirle a 2 personas ajenas al equipo que hagan una compra de prueba completa desde su celular y cronometrar cuánto tardan desde «Comprar» hasta ver la primera lección. |
