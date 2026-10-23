# YAVA · Arquitectura técnica

Superapp de domicilios (comida, mercado, farmacia y envíos) para Puerto Colombia y Barranquilla. Moneda COP, idioma es-CO.

## Monorepo (pnpm)

```
apps/mobile      Expo SDK 58 + Expo Router (iOS/Android). Una sola app con 4 experiencias por rol.
apps/admin       Next.js 16 (App Router) + Tailwind 4 → Vercel. Panel administrativo (pantallas 81–96).
packages/shared  Tokens de diseño, tipos, cálculo de precios, formato COP, etiquetas, tipos de la BD.
supabase/        Migraciones SQL, seed, config. Postgres + Auth + Storage + Realtime.
docs/            Este documento, plan de lanzamiento y checklist de tiendas.
```

## Roles y enrutamiento móvil (`apps/mobile/src/app`)

| Grupo         | Rol                                  | Pantallas del diseño |
|---------------|--------------------------------------|----------------------|
| `(auth)`      | invitado → acceso, OTP, datos, ubicación | 01–07             |
| `(customer)`  | cliente (también invitado explorando) | 08–48               |
| `(merchant)`  | comercio (`merchant_members`)        | 49–56, 65–68, 73–80  |
| `(courier)`   | repartidor (`couriers`)              | 57–64, 69–72         |
| `(owner)`     | dirección (`admin_users`)            | 97–104               |
| `modal/`      | hojas modales compartidas            |                      |

`src/app/_layout.tsx` contiene `AuthGate`: lee `useEffectiveRole()` (store `src/store/auth.ts`) y redirige al grupo correcto. Un invitado puede navegar `(customer)`; las acciones protegidas (pedir, favoritos, cuenta) llevan a `/(auth)/login`.

## Convenciones de código móvil

- **Datos**: `supabase` desde `@/lib/supabase`. Lecturas con `@tanstack/react-query` (`useQuery`, claves tipo `["orders", ...]`, `["merchant", id]`, `["order", id]`). Escrituras con `useMutation` + `queryClient.invalidateQueries`.
- **Realtime**: `useRealtimeOrder(orderId)` y `useRealtimeOrders()` en `@/hooks/useRealtimeOrder.ts`.
- **Estado local**: `useAuth`, `useCart` (persistido), `useLocation` (dirección activa) en `@/store`.
- **UI**: usar SOLO `@/components/ui` (`Screen`, `Header`, `Text`, `Button`, `Input`, `SearchBar`, `Card`, `Chip`, `Badge`, `StatusPill`, `ListRow`, `Stepper`, `Divider`, `Skeleton`, `EmptyState`, `KPI`, `Logo`). Tokens desde `@yava/shared` (`colors`, `radius`, `spacing`, `typography`). Fondo blanco, texto carbón, azul `colors.blue` para acciones, amarillo acento, rojo solo alertas.
- **Formato**: `formatCOP(38000)` → `$38.000`; `formatRating(4.8)` → `4,8`; `formatTime`.
- **Errores**: `errorMessage(e)` de `@/lib/errors`; mostrar con `Alert.alert` o texto en el formulario (sin toasts externos).
- **Copy** en español de Colombia, tuteo, frases cortas (como las maquetas: "Tu canasta", "Revisar y pagar", "Pedido confirmado").
- **Imágenes**: `expo-image` (`Image` con `contentFit="cover"`). URLs públicas o `publicUrl(bucket, path)`.
- Sin `any`. `tsc --noEmit` debe pasar. No agregar librerías nuevas sin necesidad; las instaladas: react-native-maps, expo-location, expo-image-picker, expo-image-manipulator, expo-notifications, expo-secure-store, expo-apple-authentication, expo-auth-session, expo-web-browser, expo-haptics, expo-clipboard, react-native-svg, @expo/vector-icons (Ionicons).

## Backend (Supabase) · lo que la app debe usar

Tablas: `profiles, addresses, cities, delivery_zones, merchants, merchant_members, merchant_hours, merchant_documents, product_categories, products, product_option_groups, product_options, favorites, promotions, coupons, payment_methods, orders, order_items, order_events, order_messages, payments, ratings, couriers, courier_documents, settlements, settlement_orders, courier_withdrawals, support_cases, support_messages, admin_users, admin_invitations, audit_log, platform_settings, notifications, device_tokens, owner_alerts, operating_expenses`. Tipos generados en `packages/shared/src/database.types.ts` (`Database`, `Tables<"orders">`).

Vistas: `merchant_public` (merchants + `is_open`), `order_summary` (pedido + nombres de comercio/cliente/repartidor + `items_count`), `daily_finance`, `city_summary`.

RPCs (llamar con `supabase.rpc("nombre", {...})`):
- Cliente: `place_order(p_merchant_id, p_address_id, p_items, p_payment_method, p_payment_method_id, p_coupon_code, p_notes)` — `p_items = [{product_id, qty, option_ids[], notes}]`; `place_shipment(p_pickup, p_dropoff, p_package, p_payment_method, p_notes)`; `cancel_order(p_order_id, p_reason)`; `search_catalog(p_q, p_city)`; `nearby_merchants(p_lat, p_lng, p_category, p_radius_km)`; `coverage_for(p_lat, p_lng)`; `mark_notifications_read(p_ids)`.
- Comercio: `register_merchant(p jsonb)`; `merchant_set_order_status(p_order_id, p_status, p_eta_min)` con `accepted|preparing|ready`; `merchant_dashboard(p_merchant, p_from)`.
- Repartidor: `register_courier(p jsonb)`; `courier_submit_for_review()`; `courier_available_orders(p_lat, p_lng, p_radius_km)`; `courier_accept_order(p_order_id)`; `courier_set_order_status(p_order_id, p_status, p_delivery_code)` con `picked_up|on_the_way|delivered` (delivered exige el código de 4 dígitos, o `'EFECTIVO'` si pago en efectivo); `courier_update_location(p_lat, p_lng, p_order_id)`; `request_withdrawal(p_amount)`; `courier_dashboard()`.
- Admin/Owner: `admin_overview(p_from, p_to, p_city)`; `admin_generate_settlements(p_start, p_end)`; `admin_settlement_transition(p_id, p_status, p_reason, p_reference)`; `admin_set_merchant_status(p_id, p_status, p_reason)`; `admin_set_courier_status(p_id, p_status, p_reason)`; `admin_invite(p_email, p_role)`; `admin_accept_invitation(p_token)`.

Estados de pedido: `pending_payment → placed → accepted → preparing → ready → (assigned) → picked_up → on_the_way → delivered | cancelled`. Etiquetas en `ORDER_STATUS_LABEL`.

Precios: `items_subtotal + delivery_fee (3.000) + service_fee (1.000) − discount = total`. Ejemplo oficial #1042: 28.000 + 6.000 = 34.000 + 3.000 + 1.000 = 38.000.

Storage: `product-images/{merchant_id}/...` (público), `merchant-media/{merchant_id}/...`, `avatars/{user_id}/...`, `documents/{user_id|merchant_id}/...` (privado, firmar URL).

Usuarios demo (seed, clave `yava2026`): `cliente@yava.app`, `comercio@yava.app` (Bocamar), `repartidor@yava.app`, `owner@yava.app`, `finanzas@yava.app`.

## Admin web (`apps/admin`)

Next.js App Router, `@supabase/ssr` (cliente en `src/lib/supabase/server.ts` y `client.ts`, middleware que refresca sesión y protege `/(admin)`). Acceso solo por invitación (`admin_invitations` + `admin_accept_invitation`). Roles: owner, finance, operations, support; ocultar menús según `admin_users.role`. Tablas con filtros, detalle lateral, acciones con motivo obligatorio (quedan en `audit_log`). Gráficas con `recharts`. Iconos `lucide-react`. Mismos tokens de color.
