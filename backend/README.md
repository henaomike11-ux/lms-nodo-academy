# Backend · Google Apps Script

Código del backend que corre en [script.google.com](https://script.google.com). Se guarda aquí como copia (la guía lo exige en `/backend`); la versión que corre es la del editor de Apps Script.

## Cómo publicarlo (Sprint 4)

1. Entra a script.google.com con la cuenta de Google del proyecto → **Nuevo proyecto** → nómbralo `nodo-academy-backend`.
2. Pega el contenido de `Code.gs`. En **⚙ Configuración del proyecto** marca «Mostrar el archivo de manifiesto appsscript.json» y pega `appsscript.json`.
3. En **⚙ Configuración del proyecto → Proyecto de Google Cloud Platform** pon el **número** del proyecto de Firebase (Firebase → ⚙ Configuración del proyecto → "Número del proyecto"). Esto le da al script permiso para escribir en Firestore.
4. En **Propiedades del script** agrega:
   - `PASARELA_TOKEN` → Access Token de **prueba** de Mercado Pago (Tus integraciones → Credenciales de prueba).
   - `FIREBASE_PROJECT` → id del proyecto de Firebase.
   - `SITIO_URL` → URL de GitHub Pages terminada en `/`.
5. Ejecuta una vez `probarConexion` desde el editor y acepta los permisos.
6. **Implementar → Nueva implementación → Aplicación web** · Ejecutar como: *Yo* · Acceso: *Cualquier usuario* → copia la URL `/exec`.
7. Pega esa URL en `js/firebase-config.js` (`APPS_SCRIPT_URL`) y en Mercado Pago → Tus integraciones → Webhooks (evento *Pagos*).

> Cada vez que cambies `Code.gs` debes hacer **Implementar → Administrar implementaciones → ✏ → Versión: nueva** para que la URL use el código nuevo.

## Pasarela

El código está escrito para **Mercado Pago (Checkout Pro)**, que tiene modo de prueba gratuito con usuarios vendedor/comprador y tarjetas de prueba. Si el equipo elige otra pasarela (Wompi, PayU…), solo cambian `crearPago` y `procesarAvisoDePago`; el resto (Firestore, correo) se reutiliza.

## Regla de oro

La clave secreta de la pasarela va **solo** en Propiedades del script. Nunca en este archivo, ni en el frontend, ni en un chat de IA.
