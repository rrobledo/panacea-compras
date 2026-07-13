## Context

Este cambio ajusta pantallas ya existentes del módulo Compras/Pagos/
Órdenes de Compra (migrado en `redesign-cuenta-corriente-proveedor`), no
introduce entidades nuevas. Todo el trabajo es frontend puro sobre
endpoints que ya existen (`/costos/compras`, `/costos/pagos`,
`/costos/pagos/{id}/aplicaciones`, `/costos/ordenes-compra`,
`/costos/proveedores`). El repo no tiene forma de tocar el backend, así
que cualquier campo o filtro que el backend no soporte hoy queda como
riesgo a confirmar, no como algo que este cambio pueda resolver por sí
solo.

Patrones ya establecidos que este cambio reutiliza en vez de inventar
nuevos: filtros de listado como estado local + `useList(...).filter()`
(`ComprasPage.jsx`), staging client-side antes de submit
(`useStagedList`, `CompraDetalleEditor`/`CompraImpuestoEditor`), y
`EntityPicker` con `extraParams`/`filterResults` para acotar búsquedas
por proveedor (`CompraForm`'s Orden de Compra picker,
`AplicarPagoModal`).

## Goals / Non-Goals

**Goals:**
- Listar Proveedores sin la columna Código; filtrar Órdenes de Compra por
  Estado (default Pendiente) y Proveedor; filtrar Comprobantes por
  Proveedor.
- Que un Comprobante de Contado quede saldado (saldo 0) en la misma
  operación de alta, sin un paso manual posterior de aplicar pago.
- Que los renglones de detalle traídos desde una Orden de Compra se
  puedan ajustar (cantidad, precio) antes de guardar el comprobante.
- Calcular los totales del Comprobante con el motor descripto (IVA por
  alícuota, descuento general, percepciones/retenciones/otros tributos,
  exentos/no gravados, redondeo comercial, validaciones).
- Que dar de alta un Pago en Cuenta Corriente parta de elegir el
  proveedor, mostrar sus comprobantes pendientes, y aplicar el pago a los
  que el usuario elija en la misma operación.

**Non-Goals:**
- No se implementa emisión real de comprobantes electrónicos ante ARCA/
  AFIP (sin CAE, sin webservice WSFE, sin datos del receptor propios de
  una factura de venta emitida por esta empresa). La especificación
  funcional del pedido se usa únicamente como algoritmo de cálculo de
  totales para los Comprobantes de compra que ya existen en este módulo.
- No se toca Insumos ni Ítems de Gasto (confirmados "OK" por el usuario).
- No se agregan endpoints ni se cambia el modelo de datos del backend;
  cualquier campo nuevo que este cambio necesite en el payload
  (`descuento_general`, `importe_exento`, `importe_no_gravado`, Impuesto
  simplificado) se envía sobre los endpoints existentes y su aceptación
  queda sujeta a verificación manual (ver "Open Questions").
- No se remueve `AplicarPagoModal`: sigue siendo el camino de aplicar un
  pago ya existente desde la edición de una Compra, y el fallback manual
  si el alta combinada de Pago en Cuenta Corriente falla a mitad de
  camino.

## Decisions

### D1 — Proveedores: quitar columna Código de la grilla
Se elimina la entrada `{ accessorKey: 'codigo', header: 'Código' }` de
`ProveedoresPage.jsx`. El campo `codigo` sigue existiendo en el
formulario de alta/edición; solo se retira de la vista de lista, sin
tocar el schema ni las validaciones.

### D2 — Órdenes de Compra: filtros de Estado y Proveedor
Se agrega a `OrdenesCompraPage.jsx` el mismo patrón de filtros que ya usa
`ComprasPage.jsx`: estado local `{ estado: 'PENDIENTE', proveedor_id: null }`,
un `<select>` de Estado (usando `ESTADOS_ORDEN_COMPRA` + una opción
"Todos") y un `EntityPicker` de Proveedor, con un botón "Aplicar Filtros"
que llama `filter({ estado, proveedor_id })` sobre `useList`.

`proveedor_id` como query param ya es soportado por el backend en este
mismo endpoint (se usa hoy en el picker de Orden de Compra de
`CompraForm.jsx` vía `extraParams={{ proveedor_id: proveedorId }}`). El
soporte de `estado` como query param no está confirmado — como red de
seguridad, además de mandarlo al backend se filtra el array recibido
client-side por `estado` (mismo patrón defensivo que ya usa
`CompraForm.jsx` con `filterResults` para su picker de Orden de Compra
Pendiente). Así el filtro funciona sea que el backend lo respete o lo
ignore.

### D3 — Comprobantes: filtro por Proveedor
Se agrega un `EntityPicker` de Proveedor a la fila de filtros de
`ComprasPage.jsx`, junto a Fecha Desde/Hasta/Estado, enviando
`proveedor_id` en el mismo `filter({...})`. El backend ya acepta este
parámetro en `/costos/compras` (se usa hoy desde `AplicarPagoModal` para
acotar el picker de Compra por proveedor).

### D4 — Comprobante de Contado registra Pago y Aplicación en un paso
`CompraForm` ya tiene Condición de Pago; se agrega un bloque "Pago" bajo
el formulario, visible solo cuando `condicion_pago === 'CONTADO'`
(oculto y sin validar cuando es Cuenta Corriente), que reutiliza
`PagoMediosEditor` para cargar uno o más medios de pago. Se valida antes
de habilitar el submit que la suma de los medios sea exactamente igual
al Total calculado del comprobante (misma regla que ya existe para Pago
en `tesoreria-pagos`: "Block submitting a mismatched medios total").

Al confirmar, `CompraCreatePage` ejecuta tres llamadas en secuencia:
1. `POST /costos/compras` (como hoy).
2. Si Contado: `POST /costos/pagos` con `proveedor_id` de la compra,
   `fecha` de la compra, y los medios cargados.
3. `POST /costos/pagos/{pagoId}/aplicaciones` con
   `[{ compra_id: compraId, importe: totalCompra }]`.

No es una transacción atómica — no existe tal endpoint combinado. Si el
paso 1 tiene éxito pero 2 o 3 falla, el comprobante ya fue creado (queda
pendiente, sin saldar): se navega a su edición y se muestra un toast
indicando que el pago debe completarse a mano desde ahí (el panel
"Pagos Aplicados" o desde Pagos en Cuenta Corriente), igual que ya se
hace hoy para adjuntos que fallan en el mismo submit. No se intenta
deshacer/borrar la compra ya creada — sería una acción destructiva sobre
un comprobante legítimo.

**Alternativa descartada**: pedirle al backend un endpoint combinado
`POST /costos/compras/contado` que haga las tres cosas en una
transacción. Se descarta porque el repo no puede modificar el backend
en este cambio, y el flujo de 3 llamadas ya reutiliza 100% de la lógica
existente sin nuevos endpoints.

### D5 — Renglones de Detalle editables en línea antes de guardar
Se extiende `CompraDetalleEditor` para que toda fila `_pending` (staged,
sin persistir) muestre Cantidad y Precio Unitario como inputs numéricos
editables directamente en la tabla, no solo con un botón "Quitar". Esto
se aplica a **cualquier** renglón pendiente, no solo a los que vinieron
de una Orden de Compra: distinguir el origen de la fila para habilitar
la edición solo en esas requeriría agregar un flag de procedencia sin
beneficio real (si un renglón cargado a mano también se puede corregir
en línea, es una mejora, no un problema). Los renglones ya persistidos
siguen sin poder editarse ni borrarse desde la UI, sin cambios (el
backend no expone endpoints de baja/edición por renglón, documentado ya
en el change anterior).

### D6 — Motor de cálculo de totales del Comprobante
Se reemplaza `compraTotals.js` por una función de cálculo que implementa
la especificación funcional entregada:

- **Por renglón de Detalle**: se agrega `porcentaje_descuento` (además de
  Cantidad, Precio Unitario, Alícuota IVA ya existentes) y se calcula
  `subtotalBruto = cantidad * precioUnitario`,
  `descuento = subtotalBruto * porcentajeDescuento/100`,
  `subtotal = subtotalBruto - descuento`,
  `importeIVA = subtotal * alicuotaIVA/100`, `total = subtotal + importeIVA`.
  El campo "Descuento" (importe fijo) que hoy tiene `CompraDetalleEditor`
  se reemplaza por "% Descuento" para alinear con la especificación.
- **Alícuotas de IVA admitidas**: se restringe el selector de Alícuota
  IVA en Detalle a 0%, 2.5%, 5%, 10.5%, 21%, 27% (hoy es un número libre).
  El IVA se calcula por renglón (`subtotal * alicuotaIVA/100`, ver más
  abajo) y se agrupa por alícuota para el desglose del cálculo y se suma
  para el IVA total — **no** se vuelve a pedir como un renglón de
  Impuesto: el IVA queda derivado exclusivamente de la Alícuota IVA de
  cada línea de Detalle, para no duplicarlo si además se cargara un
  renglón de Impuesto de tipo IVA. Esto es una corrección respecto de la
  primera versión de este documento: el modelo previo de `CompraImpuesto`
  incluía tipos `IVA_21`/`IVA_10_5`/`IVA_27` pensados para que el IVA se
  cargara como un renglón de Impuesto aparte (con Base Imponible ×
  Porcentaje); la especificación funcional del pedido, en cambio,
  calcula el IVA por ítem (sección 4-5), así que mantener además un
  Impuesto de tipo IVA duplicaría el importe. Se retiran los tipos
  `IVA_*` del vocabulario de `CompraImpuesto` (ver punto siguiente).
- **Descuento general**: nuevo campo a nivel Comprobante (`% Descuento
  General`), aplicado sobre el neto de cada renglón antes de recalcular
  su IVA — es decir, se prorratea sobre cada renglón antes de obtener
  `importeIVA`, no se resta del total ya con IVA calculado.
- **Impuestos simplificados y acotados a Percepciones/Retenciones/Otros
  Tributos**: `CompraImpuestoEditor` deja de pedir Base Imponible y
  Porcentaje; el modal pasa a pedir solo Tipo e Importe. El vocabulario
  de Tipo se acota a Percepción IVA/IIBB/Municipal, Retención IVA/
  Ganancias/SUSS, e Impuestos Internos — sin tipos IVA_*, ya que el IVA
  ahora es siempre derivado de Detalle (punto anterior). Se mantiene un
  único editor con `tipo` en vez de partirlo en tres listas
  independientes (Percepciones/Retenciones/Otros Tributos) como sugiere
  la especificación genérica, porque `CompraImpuesto` ya modela esa
  distinción vía `tipo`; partirlo en listas separadas sería duplicar una
  distinción que el dato ya tiene. `CompraTotalsSummary` bucketiza por
  prefijo de `tipo` (`PERCEPCION_`/`RETENCION_`/resto → Otros Tributos),
  y Retenciones se restan del Total en vez de sumarse (corrección sobre
  el motor anterior, que las sumaba todas juntas como "otrosImpuestos").
- **Importe Exento / Importe No Gravado**: nuevos campos a nivel
  Comprobante, se suman directo al Total sin pasar por IVA.
- **Totales**: `Total = NetoGravado + IVA + Percepciones + OtrosTributos
  + Exento + NoGravado - Retenciones`, redondeando cada importe monetario
  a 2 decimales con redondeo comercial (half-up), no redondeo bancario,
  para evitar diferencias de centavos contra lo que calcule el backend.
- **Validaciones cliente** antes de staging/submit: Cantidad > 0, Precio
  Unitario ≥ 0, Alícuota IVA dentro del conjunto admitido, e Importe < 0
  bloqueado salvo `tipo_comprobante = NOTA_CREDITO`. La validación
  "Total = suma de todos los componentes" queda satisfecha por
  construcción (el total sale de sumar los mismos componentes que se
  muestran), no es un chequeo independiente adicional.

### D7 — Pagos en Cuenta Corriente: alta con aplicación integrada
Se rediseña `PagoForm`/`PagoCreatePage`:
1. Al elegir Proveedor, se dispara `GET /costos/compras` con
   `proveedor_id` y `estado=PENDIENTE` (mismo endpoint que ya usa
   `AplicarPagoModal`, ahora consultado como lista completa en vez de vía
   picker de a uno).
2. Se muestra una tabla de esos comprobantes pendientes con un input
   "Importe a Aplicar" editable por fila (vacío/0 por defecto).
3. La suma de esos importes es el "Total a Cubrir"; la sección de Medios
   de Pago (`PagoMediosEditor`) se habilita recién cuando ese total es
   mayor a 0, y se mantiene la validación existente de que la suma de
   medios debe igualar ese total.
4. Al confirmar: `POST /costos/pagos` (con los medios cargados) y luego
   `POST /costos/pagos/{id}/aplicaciones` con el array
   `[{ compra_id, importe }, ...]` de todos los comprobantes con importe
   > 0, en una sola llamada (ya soportado — ver el escenario "Apply one
   pago to multiple facturas" de `tesoreria-pagos`).

Se preserva la posibilidad de crear un pago sin aplicar a ningún
comprobante (anticipo): si el usuario no carga importe en ninguna fila,
el submit solo hace el paso de `POST /costos/pagos`, igual que hoy.

Falla parcial (pago creado, aplicaciones fallan): se deja el pago
creado, se informa por toast, y el usuario completa la aplicación desde
`AplicarPagoModal` (que se mantiene sin cambios como mecanismo de
recuperación manual y como camino de aplicación desde la edición de una
Compra).

**Renombre**: "Pagos" → "Pagos en Cuenta Corriente" en el menú
(`AppLayout.jsx`) y encabezados de página. Se mantiene la ruta `/pagos`
sin cambios — es un rótulo de UI, no una URL que valga la pena romper.

## Risks / Trade-offs

- [Riesgo] El backend puede no aceptar los campos nuevos a nivel
  Comprobante (`descuento_general`, `importe_exento`,
  `importe_no_gravado`) ni el Impuesto simplificado sin
  `base_imponible`/`porcentaje` → Mitigación: verificación manual contra
  el backend real antes de dar el cambio por terminado (mismo patrón de
  tasks bloqueadas que ya usa este repo); si el backend rechaza el
  payload, ajustar a lo que sí acepte sin bloquear el resto del cambio.
- [Riesgo] El backend puede no filtrar `GET /costos/ordenes-compra` por
  `estado` → Mitigación: filtro client-side de respaldo (D2).
- [Riesgo] El flujo de Contado (3 POSTs secuenciales) no es atómico; una
  falla a mitad de camino deja un comprobante sin saldar → Mitigación:
  nunca revertir/borrar la compra ya creada; guiar al usuario a
  completarlo a mano (D4). Documentado como comportamiento esperado, no
  un bug a resolver con una transacción que este repo no puede pedir al
  backend en este cambio.
- [Trade-off] Unificar alta de Pago con la aplicación a comprobantes
  hace la pantalla más compleja (fetch dependiente del proveedor, tabla
  editable, validación cruzada) a cambio de eliminar un paso manual
  completo del flujo diario más frecuente (pagar comprobantes
  pendientes). Se acepta la complejidad porque es exactamente lo pedido
  y porque `AplicarPagoModal` sigue disponible para el caso simple/
  manual.

## Migration Plan

Sin migración de datos — todo el cambio es de frontend sobre endpoints
existentes. Orden sugerido de implementación (de menor a mayor riesgo/
dependencia):
1. Proveedores (D1) y filtros de Órdenes de Compra / Comprobantes
   (D2, D3) — independientes entre sí, bajo riesgo.
2. Impuestos simplificados y motor de cálculo (D6) — se verifica primero
   contra el backend real que los campos nuevos se acepten, antes de
   construir el resto sobre esa base.
3. Renglones editables desde Orden de Compra (D5) — independiente, se
   puede intercalar en cualquier momento.
4. Comprobante de Contado con Pago integrado (D4) — depende de que D6 ya
   calcule el Total correctamente (es lo que se manda a saldar).
5. Pagos en Cuenta Corriente (D7) — independiente de D4 pero reutiliza el
   mismo criterio de "comprobante pendiente"; se hace al final para
   dejar la verificación manual de ambos flujos de pago (D4 y D7) juntos.

Cada grupo se verifica manualmente contra el backend real
(`panacea-produccion-backend`) antes de continuar con el siguiente,
siguiendo el mismo patrón de tasks de verificación bloqueadas que ya usa
`tasks.md` del change anterior. Rollback: revertir los commits del
grupo afectado; no hay estado persistido que limpiar.

## Open Questions

- ¿El endpoint de alta/edición de `Compra` acepta `descuento_general`,
  `importe_exento` e `importe_no_gravado` como campos del maestro, o
  conviene modelarlos como renglones de Impuesto con un `tipo` dedicado
  para no depender de columnas nuevas en el backend?
- ¿`CompraImpuesto` acepta `base_imponible`/`porcentaje` como opcionales/
  nulos, o son NOT NULL en el backend? Determina si el payload
  simplificado puede mandar `null`/`0` o si hace falta seguir calculando
  algo internamente aunque la UI ya no lo pida.
- "Pendientes por defecto" en Órdenes de Compra, ¿es estrictamente
  `estado = PENDIENTE`, o debería incluir también `PARCIAL` (recepción
  parcial, todavía accionable)? Se implementa como `PENDIENTE` estricto
  salvo indicación contraria.
- Para Pagos en Cuenta Corriente, ¿la lista de comprobantes a aplicar
  debe incluir también los `PARCIAL` (parcialmente pagados) además de
  `PENDIENTE`, ya que `AplicarPagoModal` hoy no filtra por estado en
  absoluto? Se implementa incluyendo ambos (`PENDIENTE` y `PARCIAL`)
  salvo indicación contraria, ya que un comprobante parcialmente pagado
  sigue siendo un destino válido de aplicación.
