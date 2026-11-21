# Plan de integración de pedidos con WooCommerce

**Estado:** pedidos pendientes de pago en WooCommerce y cotización por WhatsApp están disponibles; integración de pago Wompi pendiente de configuración y prueba.  
**Objetivo:** procesar compras con Wompi mediante WooCommerce y conservar WhatsApp solo para solicitudes de cotización.

## Situación actual

- El catálogo se consulta desde WooCommerce mediante WPGraphQL.
- El carrito de la tienda se mantiene en el navegador y se persiste en `localStorage` (`CartProvider`); no es el carrito de sesión de WooCommerce.
- El checkout mantiene el carrito en el navegador; **Crear pedido (pago pendiente)** valida productos, variaciones, stock y precios en el servidor y registra un pedido de invitado en WooCommerce sin iniciar un cobro.
- **Cotizar por WhatsApp** envía una solicitud independiente, sin crear un pedido ni iniciar un pago.
- La integración de pago en línea con Wompi seguirá pendiente hasta configurar y probar su flujo headless oficial.
- El selector de dirección usa departamento y municipio de Colombia. El catálogo local contiene 1.123 registros descargados de [API-Colombia](https://api-colombia.com/api/v1/City) y no requiere una llamada a un servicio externo por compra; revisar/actualizarlo contra el listado oficial de DIVIPOLA cuando corresponda.
- La cuenta de Wompi existe, pero el plugin/configuración de pagos en WooCommerce y el flujo de pago no están listos ni probados.
- La compra será como invitado: no se exigirá crear una cuenta para comprar.
- Ya existe un historial de productos vistos (`RecentlyViewedProvider`) persistido en la cookie `example_recently_viewed`; todavía no hay un centro de preferencias de cookies/consentimiento.
- Las credenciales REST privadas están configuradas en el entorno local y la lectura autenticada fue probada. El pedido de prueba #96 quedó pendiente y sin pagar; revisar su moneda/estado en WooCommerce antes de cualquier gestión real.

## Recomendación de arquitectura

Separar responsabilidades:

1. **Next.js:** formulario y experiencia del checkout; puede iniciar el pago cuando se acuerde y pruebe el flujo oficial.
2. **WooCommerce:** fuente de verdad para productos, precios, variaciones, disponibilidad, impuestos, envío, pedidos y estado de pago.
3. **Wompi:** configurar y operar desde WooCommerce mediante su plugin oficial/compatible. Next.js no debe recibir ni procesar datos de tarjetas.
4. **WhatsApp:** solo para cotizar. La solicitud se envía al comercio, no crea un pedido en WooCommerce y no inicia pago.
5. **Personalización dentro del sitio:** usar primero datos propios mínimos (por ejemplo, productos vistos recientemente) para retomar la navegación y mostrar recomendaciones. Esto no requiere una cuenta ni significa automáticamente activar seguimiento publicitario fuera del sitio.

Conservar GraphQL para consultas del catálogo. La API REST de servidor crea pedidos pendientes mediante `/api/woocommerce-order` y valida productos/stock; sus credenciales deben permanecer privadas (`WOOCOMMERCE_CONSUMER_KEY` y `WOOCOMMERCE_CONSUMER_SECRET`, sin `NEXT_PUBLIC_`). El endpoint `/api/whatsapp-quote` solo prepara el mensaje de cotización y requiere `PHONE_NUMBER`.

El pedido pendiente no representa una compra pagada: el envío y las instrucciones de pago se confirman después. No despachar ni marcar pedidos como pagados sin confirmar el pago por un medio acordado. La integración con Wompi debe añadirse mediante el flujo oficial del plugin cuando esté configurado.

La creación de un pedido por REST no garantiza por sí sola el inicio del pago en todos los plugins. Antes de decidir el flujo online, hay que comprobar cómo la pasarela elegida inicia y confirma el pago. Si requiere el checkout o la sesión de WooCommerce, se debe usar el mecanismo oficial que recomiende ese plugin (por ejemplo, Store API o un endpoint propio de WordPress), no simular el pago desde el frontend.

Para cookies y medición, distinguir entre almacenamiento estrictamente necesario para el funcionamiento de la tienda y tecnologías opcionales de analítica o publicidad. Antes de ampliar el seguimiento, definir preferencias claras, respetar la elección del visitante y revisar la política de privacidad y los requisitos legales aplicables. No cargar píxeles ni enviar datos a plataformas publicitarias hasta que exista una decisión explícita de hacerlo y el consentimiento requerido.

## Prioridades

### P0 — Configurar y probar Wompi en WooCommerce

- Instalar/activar el plugin de Wompi en WooCommerce y completar su configuración con las llaves de prueba desde el administrador; no poner llaves Wompi en `NEXT_PUBLIC_` ni en el navegador.
- Configurar la tienda en COP y revisar que productos, impuestos y envío aparezcan con moneda e importes correctos.
- Completar una compra de prueba desde el checkout normal de WooCommerce; verificar redirección, aprobación, rechazo, cancelación y actualización real del estado por notificación del proveedor.
- Confirmar qué endpoint oficial permite iniciar un pago desde la tienda headless con la extensión instalada (checkout URL, Store API o integración específica del plugin).
- Mantener habilitadas las credenciales REST privadas solo donde Next.js deba validar producto/stock o crear el pedido.
- Acordar cómo se calculan envío, impuestos y regiones de despacho antes de habilitar el pago desde Next.js.

**Salida:** Wompi probado en modo sandbox en WooCommerce, moneda COP confirmada y flujo headless documentado.

### P1 — Conectar el pago online headless

- Implementar el botón de pago solo después de completar P0.
- Crear el pedido de invitado en WooCommerce y redirigir por el flujo oficial de Wompi; no confiar en precios ni totales enviados por el cliente.
- Validar y limitar los datos recibidos (cliente, dirección, productos, variaciones y cantidades).
- Resolver en el servidor los IDs de WooCommerce y volver a consultar precios y stock. No aceptar del navegador nombres, precios, descuentos ni totales como fuente de verdad.
- Usar el municipio seleccionado para calcular la tarifa de envío configurada en WooCommerce; no iniciar pago antes de mostrar el total final.
- Devolver al navegador únicamente el identificador/URL de pago que haga falta.
- No marcar el pedido como pagado al volver del navegador; verificar el resultado con el mecanismo servidor-a-servidor de Wompi/WooCommerce.

**Criterio de aceptación:** una compra de invitado de prueba utiliza precios y envío de WooCommerce, llega a Wompi y solo cambia a pagada después de la confirmación válida del proveedor.

### P2 — Mantener cotización independiente por WhatsApp

- El botón **Cotizar por WhatsApp** envía productos y datos de contacto/dirección, sin crear pedido WooCommerce ni iniciar pago.
- No enviar precios/totales como importes finales de cotización; el comercio confirma disponibilidad y envío.
- Mantener el carrito en el sitio; la solicitud de cotización no se presenta como compra completada.
- Validar que el municipio pertenece al departamento seleccionado.

**Criterio de aceptación:** enviar una cotización abre WhatsApp con la solicitud legible y no crea ningún pedido en WooCommerce.

### P3 — Verificación y salida a producción de pagos

- Validar en sandbox redirección, cancelación, rechazo, retorno exitoso y notificación servidor-a-servidor (webhook/callback) si la pasarela la requiere.
- Verificar que repetir o falsificar el retorno del navegador no permita marcar un pedido como pagado.
- Habilitar el medio de pago en producción solo después de comprobar el flujo completo y la moneda COP.

**Criterio de aceptación:** WooCommerce refleja el estado real informado por la pasarela, incluidos pagos fallidos y cancelados.

### P4 — Personalización y remarketing dentro del sitio

- Mantener la compra como invitado; cookies o almacenamiento del navegador no deben convertirse en un requisito de cuenta o de compra.
- Auditar `example_recently_viewed`: hoy almacena hasta 12 productos por 30 días en una cookie escrita desde el navegador. Definir consentimiento, vencimiento, limpieza y preferencias antes de ampliar su uso.
- Para personalización dentro del sitio, preferir persistir solo identificadores de productos y fechas de visita, y recuperar nombres, imágenes y precios vigentes del catálogo; evitar guardar información personal o datos innecesarios.
- Implementar controles visibles para aceptar, rechazar y cambiar preferencias de tecnologías opcionales. La compra y el carrito deben seguir funcionando si se rechazan.
- Usar el historial consentido para retomar productos vistos y recomendaciones en la tienda. Medir su utilidad con datos agregados y minimizados.
- Tratar campañas de retargeting en plataformas externas (por ejemplo, píxeles publicitarios) como una iniciativa separada: no forman parte del remarketing dentro del sitio y requieren definir proveedor, finalidad, datos compartidos, consentimiento y actualización de la política antes de habilitarlas.

**Criterio de aceptación:** la personalización funciona sin registro, respeta las preferencias, permite retirar el consentimiento y no envía eventos a terceros cuando no se ha autorizado el seguimiento opcional.

### P5 — Sesiones y cuentas de usuario (posterior al MVP)

No bloquear el checkout por no tener sesiones o registro. Más adelante se puede implementar login, historial de pedidos y asociación de compras a una cuenta.

Si la pasarela seleccionada exige una sesión/carrito de WooCommerce, resolver esa necesidad dentro del flujo oficial de checkout de la pasarela; no implica necesariamente implementar cuentas de usuario propias.

## Decisiones pendientes

1. ¿Qué plugin de Wompi está instalado y qué flujo recomienda para tiendas headless?
2. ¿Qué tarifas de envío e impuestos se aplicarán por municipio?
3. ¿Qué usos de personalización dentro del sitio se priorizan (vistos recientemente, recomendaciones u otros)?
4. ¿Se planea habilitar retargeting en plataformas externas, o el alcance se limita a personalización dentro del sitio?
5. ¿Se desea asociar más adelante pedidos de invitado a cuentas de usuario?

## Orden sugerido de implementación

1. Completar P0: configurar Wompi en modo de pruebas y verificar moneda/tarifas.
2. Completar P1: implementar pago de invitado con el flujo headless oficial y notificación de Wompi.
3. Mantener P2: cotización por WhatsApp como flujo separado que no crea pedidos.
4. Completar P3 antes de habilitar los pagos en producción.
5. Completar P4: revisar el historial existente, definir preferencias/consentimiento y mejorar personalización propia dentro del sitio.
6. Priorizar P5 cuando exista una necesidad concreta de cuentas o historial de pedidos.

## Referencias del proyecto

- Checkout: `app/checkout/page.tsx`
- Cotización por WhatsApp: `app/api/whatsapp-quote/route.ts`
- Departamentos y municipios de Colombia: `lib/woocommerce/colombia.ts` y `lib/woocommerce/colombia-municipalities.json` (snapshot de API-Colombia; revisar/actualizar periódicamente)
- Carrito local: `components/providers/CartProvider.tsx`
- Historial de productos vistos: `components/providers/RecentlyViewedProvider.tsx` y `lib/cookies/recently-viewed.ts`
- Política de protección de datos: `app/politica-proteccion-datos/page.tsx`
- Proxy de WPGraphQL: `app/api/graphql/route.ts`
- Cliente GraphQL de WooCommerce: `lib/woocommerce/index.ts`
