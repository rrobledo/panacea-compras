## REMOVED Requirements

### Requirement: List Facturas/Gastos
**Reason**: `/costos/ctacteprov` and `/costos/ctacteprovresumen` are
retired by the backend in favor of the normalized `Compra` model.
**Migration**: Use the `compras` capability's "List Compras" requirement
(`GET /costos/compras`, `GET /costos/cuenta-corriente/resumen`).

### Requirement: Create Factura/Gasto
**Reason**: Flat `iva`/`percepcion` totals and base64 image fields are
replaced by discriminated `CompraImpuesto` rows and real file uploads.
**Migration**: Use the `compras` capability's "Create Compra" requirement
(`POST /costos/compras`).

### Requirement: Edit Factura/Gasto
**Reason**: Replaced by the `compras` capability's equivalent, extended
with an Impuestos panel alongside Detalle and Pagos.
**Migration**: Use the `compras` capability's "Edit Compra" requirement
(`PUT /costos/compras/{id}`).

### Requirement: Delete Factura/Gasto
**Reason**: Replaced by the `compras` capability's equivalent.
**Migration**: Use the `compras` capability's "Delete Compra" requirement
(`DELETE /costos/compras/{id}`).

### Requirement: Manage Pagos
**Reason**: Payments are no longer nested one-to-one under a single
factura; `Pago`/`PagoAplicacion` supports one payment applied across
multiple compras.
**Migration**: Use the `tesoreria-pagos` capability's "Create Pago with
multiple medios" and "Apply a pago to one or more compras" requirements,
and the `compras` capability's "Pagos Aplicados panel" requirement.

### Requirement: View Detalle de Insumos
**Reason**: Replaced by `CompraDetalle`, which supports Insumo, Ítem de
Gasto, and free-text lines instead of Insumo-only lines.
**Migration**: Use the `compras` capability's "Compra detalle"
requirement.

### Requirement: Add Insumo to Detalle
**Reason**: Replaced by the `compras` capability's "Compra detalle"
requirement, which generalizes to three line types.
**Migration**: Use the `compras` capability's "Compra detalle"
requirement.

### Requirement: Remove Insumo from Detalle
**Reason**: Replaced by the `compras` capability's "Compra detalle"
requirement's staged-removal behavior.
**Migration**: Use the `compras` capability's "Compra detalle"
requirement.
