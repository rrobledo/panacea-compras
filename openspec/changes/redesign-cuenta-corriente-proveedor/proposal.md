## Why

The backend change `redesign-cuenta-corriente-proveedor` (in
`panacea-produccion-backend`) has replaced the flat `CuentaCorrienteProveedor`
model with a normalized `Compra`/`Pago`/`OrdenCompra`/`MovimientoCC` schema and
shipped new endpoints under `/costos/compras`, `/costos/pagos`,
`/costos/ordenes-compra`, `/costos/cuenta-corriente*`, and
`/costos/libro-iva-compras`. Per that change's Migration Plan (D6), the legacy
`/costos/ctacteprov*` routes stay live only until this frontend — the only
consumer — cuts over; once it does, the backend removes the legacy routes in
the same release. This frontend has no global/cached state (each screen owns
its own fetch), so the cutover is a bounded rewrite rather than a gradual
migration, and no fiscal-detail UI has been built yet anywhere to migrate away
from — building it once against the new contract is the last gate before the
backend can retire the old table.

## What Changes

- **BREAKING**: Retire the `facturas-gastos` capability (`/costos/ctacteprov*`
  screens) and replace it with a `compras` capability against
  `/costos/compras*`: comprobante type (Factura A/B/C/M, ND, NC, Ticket,
  Gasto), a per-row `detalle` line editor choosing between Insumo
  (autocomplete), Item de Gasto (autocomplete), or texto libre, and a
  discriminated `impuestos` editor (IVA por alícuota, percepciones,
  retenciones) instead of flat `iva`/`percepcion` totals.
- **New**: `tesoreria-pagos` capability — a Pagos screen where a single
  payment can be split across multiple `medios` (transferencia, cheque,
  echeq, efectivo, tarjeta), with banking fields (banco/número/fecha de
  acreditación) required only for cheque/echeq, and applied (full or split)
  against one or more pending compras via `PagoAplicacion`.
- **New**: `ordenes-compra` capability — CRUD for purchase orders with
  `detalle` (cantidad pedida), and reception progress (`PENDIENTE` /
  `PARCIAL` / `RECIBIDA`) shown read-only, advanced by creating a `Compra`
  against the orden.
- **New**: an Item de Gasto catalog screen (`/costos/items-gasto`), CRUD,
  same shape/pattern as the existing Insumos catalog screen — needed so
  compra detalle rows of `tipo=ITEM_GASTO` have something to pick from.
- **New**: `libro-iva-compras` capability — a read-only Libro IVA Compras
  report filterable by período, columns per tax type plus a
  `sin_discriminar` column for historical (pre-migration) compras.
- **Modified**: `proveedores` capability — add `codigo`, `nombre_fantasia`,
  `condicion_iva`, and `condicion_pago` fields to the create/edit forms and
  list.
- **Modified**: `reportes-costos` capability — the Dashboard's cuenta
  corriente summary card switches from `GET /costos/ctacteprovresumen` to
  `GET /costos/cuenta-corriente/resumen`, and the Proveedor detail/ledger
  view (if any) switches to `GET /costos/proveedores/{id}/cuenta-corriente`
  for the Debe/Haber ledger with running saldo.
- **Explicitly out of scope**: any accounting/asiento UI (centro de
  costo/cuenta contable stay unexposed, matching the backend's reserved
  nullable FKs), multi-currency, and a goods-receipt UI beyond showing
  `OrdenCompra` reception progress.

## Capabilities

### New Capabilities
- `compras`: comprobante CRUD (list/create/edit/delete) with detalle lines
  (Insumo/Item de Gasto/texto libre) and discriminated impuestos, attachment
  upload, replacing `facturas-gastos`.
- `tesoreria-pagos`: payment CRUD with multi-método splits and application
  against one or more compras.
- `ordenes-compra`: purchase order CRUD with reception-progress display.
- `items-gasto`: catalog CRUD for reusable expense concepts, same
  list/create/edit/delete shape as the existing `insumos` catalog.
- `libro-iva-compras`: read-only VAT purchase ledger report by período.

### Modified Capabilities
- `proveedores`: add `codigo`, `nombre_fantasia`, `condicion_iva`,
  `condicion_pago` to the Proveedor forms/list/detail.
- `reportes-costos`: Dashboard summary card and any cuenta-corriente ledger
  view source from the new `/costos/cuenta-corriente*` endpoints instead of
  `/costos/ctacteprov*`.

### Removed Capabilities
- `facturas-gastos`: superseded by `compras` + `tesoreria-pagos`; the
  `/costos/ctacteprov*` endpoints it depended on are retired by the backend
  once this cutover ships.

## Impact

- **Affected code**: `src/pages/facturas/**` (rewritten as
  `src/pages/compras/**` and `src/pages/pagos/**`), `src/pages/proveedores/**`
  (form/list field additions), `src/pages/DashboardPage.jsx` (summary source
  endpoint), `src/App.jsx` (routes), plus a new `src/pages/ordenes-compra/**`,
  `src/pages/items-gasto/**`, and `src/pages/reportes/LibroIvaPage.jsx`.
- **API surface**: all calls to `/costos/ctacteprov*` removed; new calls to
  `/costos/compras*`, `/costos/pagos*`, `/costos/ordenes-compra*`,
  `/costos/items-gasto*`, `/costos/cuenta-corriente*`,
  `/costos/libro-iva-compras`.
- **Navigation**: `AppLayout` menu entries for Facturas/Gastos replaced with
  Compras and Pagos; new entries for Órdenes de Compra, Ítems de Gasto, and
  Libro IVA Compras.
- **Sequencing dependency**: this frontend must deploy against the new
  endpoints before the backend removes `/costos/ctacteprov*` (backend change
  task 10.1, currently blocked on this repo).
- **Tests**: no automated frontend tests exist in this repo today (manual
  verification only, per `SKILL.md`/CLAUDE.md conventions); this change
  should be manually verified against a running backend before deploy.
