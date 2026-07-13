## Why

Con el módulo nuevo de Compras/Pagos/Órdenes de Compra ya migrado
(`redesign-cuenta-corriente-proveedor`), el uso diario expuso fricciones
concretas: las listas no se pueden filtrar por lo que realmente se busca
(proveedor en Comprobantes y Órdenes de Compra, estado en Órdenes de
Compra), cargar un Comprobante de Contado obliga a un paso manual
posterior para conciliar el pago, los renglones traídos desde una Orden de
Compra no se pueden ajustar antes de guardar, el cálculo de totales del
Comprobante no refleja las reglas reales de IVA/percepciones/retenciones
de ARCA (ex AFIP), y aplicar un pago a los comprobantes pendientes de un
proveedor requiere abrir el pago ya creado y aplicarlo comprobante por
comprobante. Insumos e Ítems de Gasto ya funcionan como se espera y quedan
fuera de este cambio.

## What Changes

- **Proveedores**: ocultar la columna Código en el listado (el dato sigue
  existiendo en alta/edición, solo se retira de la grilla).
- **Órdenes de Compra**: agregar filtro por Estado (por defecto
  "Pendiente") y por Proveedor al listado.
- **Comprobantes (Compras)**: agregar filtro por Proveedor al listado
  (se suma al de Fecha Desde/Hasta/Estado ya existente).
- **Nuevo Comprobante — Pago inmediato en Contado**: cuando Condición de
  Pago es Contado, habilitar una sección para cargar los datos del pago
  (mismo editor de Medios de Pago que usa Pagos); al grabar, el sistema
  registra el comprobante, el pago y la aplicación del pago al comprobante
  por el total, de forma que el saldo pendiente quede en 0. Cuando la
  condición es Cuenta Corriente, esa sección permanece deshabilitada y
  solo se registra el comprobante. **BREAKING**: cambia el flujo de alta
  de un Comprobante de Contado, que antes requería un pago manual
  posterior.
- **Nuevo Comprobante — renglones editables desde Orden de Compra**:
  cuando los renglones se cargan automáticamente desde una Orden de
  Compra, Cantidad y Precio Unitario pasan a ser editables en la tabla
  antes de guardar (hoy solo se pueden quitar y volver a cargar a mano).
- **Nuevo Comprobante — motor de cálculo de totales**: reemplazar el
  cálculo actual (aproximado, solo de vista previa) por el motor descripto
  en la especificación funcional del pedido: descuento por renglón,
  agrupación de IVA por alícuota (0%, 2.5%, 5%, 10.5%, 21%, 27%),
  descuento general sobre el neto (recalcula bases e IVA), listas
  independientes de Percepciones/Retenciones/Otros Tributos, Importe
  Exento e Importe No Gravado, fórmula de Total Factura, redondeo
  comercial a 2 decimales, y las validaciones de cantidad/precio/alícuota/
  consistencia de totales descriptas. **BREAKING**: cambia la forma de
  cargar Impuestos (ver punto siguiente) y el cálculo de Total mostrado.
- **Nuevo Comprobante — impuestos simplificados**: el alta de un renglón
  de Impuesto (IVA, percepción, retención, otro tributo) pasa a pedir solo
  el Importe, sin los campos Base Imponible y Porcentaje que hoy son
  editables en el modal.
- **Pagos → "Pagos en Cuenta Corriente"**: renombrar la pantalla y
  rediseñar el alta: al elegir el Proveedor, el sistema trae sus
  comprobantes pendientes y permite ingresar el importe a aplicar a cada
  uno; la suma de esos importes determina el total a cubrir con los
  Medios de Pago. Al grabar, se crea el pago y se aplica automáticamente
  a cada comprobante seleccionado por el importe indicado, en un solo
  paso. **BREAKING**: reemplaza el flujo actual de crear el pago sin
  comprobantes asociados y aplicarlo después, comprobante por comprobante,
  desde `AplicarPagoModal`.

## Capabilities

### New Capabilities
(none — todos los cambios son requisitos nuevos o modificados de
capacidades ya existentes)

### Modified Capabilities
- `proveedores`: el listado deja de mostrar la columna Código.
- `ordenes-compra`: el listado agrega filtros de Estado (default
  Pendiente) y Proveedor.
- `compras`: filtro por Proveedor en el listado; alta de Comprobante de
  Contado registra pago y aplicación junto con el comprobante; renglones
  de detalle cargados desde una Orden de Compra son editables en Cantidad
  y Precio Unitario antes de guardar; el alta de Impuestos pide solo
  Importe; el cálculo de totales sigue el motor de cálculo descripto
  (IVA por alícuota, descuento general, percepciones/retenciones/otros
  tributos, exentos/no gravados, redondeo comercial, validaciones).
- `tesoreria-pagos`: el alta de un Pago pasa a partir de la selección del
  Proveedor, mostrar sus comprobantes pendientes con importe a aplicar
  editable por renglón, y aplicar el pago a todos los comprobantes
  seleccionados en la misma operación de alta.

## Impact

- `src/pages/proveedores/ProveedoresPage.jsx` — columnas del listado.
- `src/pages/ordenes-compra/OrdenesCompraPage.jsx`,
  `src/pages/ordenes-compra/constants.js` — filtros de listado.
- `src/pages/compras/ComprasPage.jsx` — filtro por Proveedor.
- `src/pages/compras/CompraForm.jsx`, `CompraCreatePage.jsx`,
  `CompraEditPage.jsx`, `CompraDetalleEditor.jsx`,
  `CompraImpuestoEditor.jsx`, `CompraTotalsSummary.jsx`,
  `compraTotals.js`, `constants.js` — sección de pago condicional en
  Contado, edición inline de renglones desde Orden de Compra, motor de
  cálculo nuevo, impuestos simplificados a solo Importe.
- `src/pages/pagos/PagosPage.jsx`, `PagoForm.jsx`, `PagoCreatePage.jsx`,
  `AplicarPagoModal.jsx`, `PagoMediosEditor.jsx` — nuevo flujo de alta con
  selección de comprobantes pendientes antes de los medios de pago;
  renombrado de pantalla/menú a "Pagos en Cuenta Corriente".
- `src/App.jsx`, `src/components/layout/AppLayout.jsx` — rótulo de menú
  "Pagos en Cuenta Corriente".
- Endpoints backend reutilizados sin cambios anticipados:
  `POST /costos/compras`, `POST /costos/pagos`,
  `POST /costos/pagos/{id}/aplicaciones`, `GET /costos/compras`
  (filtro por `proveedor_id`), `GET /costos/ordenes-compra` (filtro por
  `estado`/`proveedor_id`). El compatibilidad exacta del payload
  simplificado de Impuestos (`CompraImpuesto` sin `base_imponible`/
  `porcentaje`) con el backend queda como riesgo a validar en `design.md`.
