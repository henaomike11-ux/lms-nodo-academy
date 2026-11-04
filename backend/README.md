# Backend · Google Apps Script + Wompi

Código del backend que corre en [script.google.com](https://script.google.com). Se guarda aquí como copia (la guía lo exige en `/backend`); la versión que corre es la del editor de Apps Script.

## Pasarela de pago: Wompi (Colombia)

Usamos el **Web Checkout** de Wompi: el backend arma el enlace con la firma de integridad y el estudiante paga en la página de Wompi. Wompi avisa el resultado con un **evento** (webhook) a la URL del script, que verifica el checksum, consulta la transacción y crea la inscripción.

Cuenta y llaves (Wompi → Desarrolladores):
- **Llave pública** (`pub_test_…`) y **llave privada** (`prv_test_…`).
- **Secreto de integridad** (`test_integrity_…`): firma del checkout.
- **Secreto de eventos** (`test_events_…`): verificación del webhook.
- Para pruebas se usan las llaves de **sandbox** y las [tarjetas de prueba](https://docs.wompi.co/docs/colombia/datos-de-prueba/) de Wompi (por ejemplo, `4242 4242 4242 4242` aprueba; otras rechazan o quedan pendientes).

## Cómo publicarlo (Sprint 4)

1. Entra a script.google.com con la cuenta de Google del proyecto → **Nuevo proyecto** → nómbralo `nodo-academy-backend`.
2. Pega el contenido de `Code.gs`. En **⚙ Configuración del proyecto** marca «Mostrar el archivo de manifiesto appsscript.json» y pega `appsscript.json`.
3. En **⚙ Configuración del proyecto → Proyecto de Google Cloud Platform** pon el **número** del proyecto de Firebase: `150284357973`. Así el script puede escribir en Firestore con el permiso de la cuenta dueña.
4. En **Propiedades del script** agrega:

   | Propiedad | Valor |
   |---|---|
   | `WOMPI_PUBLIC_KEY` | `pub_test_…` |
   | `WOMPI_PRIVATE_KEY` | `prv_test_…` |
   | `WOMPI_INTEGRITY_SECRET` | `test_integrity_…` |
   | `WOMPI_EVENTS_SECRET` | `test_events_…` |
   | `WOMPI_ENV` | `sandbox` (cambiar a `production` al salir en vivo) |
   | `FIREBASE_PROJECT` | `nodo-academy-bc8b2` |
   | `SITIO_URL` | `https://henaomike11-ux.github.io/lms-nodo-academy/` |

5. Ejecuta una vez `probarConexion` desde el editor y acepta los permisos.
6. **Implementar → Nueva implementación → Aplicación web** · Ejecutar como: *Yo* · Acceso: *Cualquier usuario* → copia la URL `/exec`.
7. Pega esa URL en `js/firebase-config.js` (`APPS_SCRIPT_URL`) y en **Wompi → Desarrolladores → URL de eventos** (sandbox).

> Cada vez que cambies `Code.gs` debes hacer **Implementar → Administrar implementaciones → ✏ → Versión: nueva** para que la URL use el código nuevo.

## Flujo completo

1. `pago.html` → `crearPago` → el script guarda el intento en `payments` (id = referencia `uid__curso__tiempo`) y devuelve el enlace `checkout.wompi.co/p/?…&signature:integrity=…`.
2. El estudiante paga en Wompi y vuelve a `pago.html?estado=retorno&curso=…&id=<transacción>`.
3. En paralelo, Wompi envía el evento `transaction.updated` al script: verifica el checksum (SHA256 de las propiedades + timestamp + secreto de eventos), consulta `GET /v1/transactions/{id}` y, si es `APPROVED`, escribe `enrollments/{uid}_{curso}` y pasa el lead a `cliente`.
4. `pago.html` también pregunta `estadoPago` al script con el id (plan B si el evento se demora) y muestra éxito, pendiente o rechazado.

## Regla de oro

Las llaves y secretos de Wompi van **solo** en Propiedades del script. Nunca en este archivo, ni en el frontend, ni en un chat de IA. La llave pública sí puede viajar en el enlace de pago (es pública por diseño).
