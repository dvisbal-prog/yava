# Checklist de publicación

## Apple App Store
- [ ] Cuenta Apple Developer (organización, D-U-N-S) · Team ID
- [ ] App en App Store Connect: nombre "YAVA", bundle `co.yava.app`, SKU, categoría Comida y bebida
- [ ] Sign in with Apple habilitado (capability) — obligatorio porque ofrecemos Google
- [ ] Capturas: iPhone 6,7" (1290×2796) y 6,5" (1284×2778) — mínimo 3, ideal 6 (inicio, comercio, canasta, seguimiento, comercio panel, repartidor)
- [ ] Ícono 1024×1024 sin transparencia (logo aprobado)
- [ ] URL de política de privacidad y soporte
- [ ] Privacidad de la app (App Privacy): ubicación precisa, nombre, teléfono, correo, dirección, historial de compras, identificadores (push) — todos vinculados al usuario, uso: funcionalidad de la app
- [ ] Permisos con texto claro (ya en `app.json`): ubicación, cámara, fotos
- [ ] Cuenta demo para revisión: cliente, comercio y repartidor + instrucciones (en Notas de revisión)
- [ ] Clasificación por edad 4+ (sin alcohol en catálogo; si se vende licor → 17+ y verificación de edad)
- [ ] Encriptación: `ITSAppUsesNonExemptEncryption=false` ya configurado
- [ ] `eas build -p ios --profile production` → `eas submit -p ios`

## Google Play
- [ ] Cuenta de desarrollador como **organización** (evita la exigencia de 12 testers/14 días)
- [ ] App "YAVA", paquete `co.yava.app`, categoría Comida y bebidas
- [ ] Ícono 512×512, gráfico de funciones 1024×500, capturas teléfono 1080×1920 (mín. 2)
- [ ] Política de privacidad (URL), Seguridad de los datos (formulario), Clasificación de contenido (cuestionario IARC)
- [ ] Declaración de permisos de ubicación en segundo plano (repartidores): video corto mostrando el uso durante la entrega
- [ ] Cuenta de servicio con permisos de publicación → `google-play-service-account.json`
- [ ] Pista interna → cerrada → producción. `eas build -p android --profile production` → `eas submit -p android`
- [ ] Firma de apps de Google Play (EAS la gestiona)

## Antes del primer envío
- [ ] Reemplazar íconos placeholder por el logo aprobado (`apps/mobile/assets/images/`)
- [ ] `REEMPLAZAR_CON_EAS_PROJECT_ID` en `app.json` y datos de `eas.json` → submit
- [ ] Variables EXPO_PUBLIC_* en EAS secrets · claves de Google Maps
- [ ] Términos y condiciones + política de privacidad publicados (pueden ir en Vercel: `admin.yava.app/legal/...` o dominio público)
- [ ] Prueba completa en iOS y Android reales: OTP, Google, Apple, ubicación, pedido, push, pago Wompi sandbox

## Páginas legales
- Borradores publicados con el panel web: `https://<admin>/legal/privacidad` y `https://<admin>/legal/terminos` (rutas públicas). **Revisión legal obligatoria antes de enviar a las tiendas.**
