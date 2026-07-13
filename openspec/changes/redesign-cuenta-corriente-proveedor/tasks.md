## 1. Shared services and components

- [x] 1.1 ~~Add `compraService`, `pagoService`, `ordenCompraService`,
      `itemGastoService` using `createCrudService`~~ — deviation: audited
      the codebase and found `createCrudService` isn't actually used
      anywhere (every existing page calls `api.get/post/put/delete`
      directly with inline URLs); followed that established convention
      instead of introducing an unused abstraction.
- [x] 1.2 One-off calls for `POST /costos/compras/{id}/detalle`,
      `POST /costos/compras/{id}/impuestos`,
      `POST /costos/compras/{id}/adjuntos` (multipart),
      `GET /costos/compras/{id}/pagos`,
      `POST /costos/pagos/{id}/aplicaciones`,
      `GET /costos/cuenta-corriente/resumen`,
      `GET /costos/libro-iva-compras` — made inline via `api` in the pages
      that use them, per 1.1's convention. `GET /costos/proveedores/{id}/cuenta-corriente`
      not yet wired to a screen (no ledger-detail view was in scope this pass).
- [x] 1.3 Built `FileUploadField` (`src/components/form/FileUploadField.jsx`)
      holding a `File` object for staging and exposing it for multipart
      commit, per design.md D5 — does not reuse `ImageField`'s base64
      encoding.
- [x] 1.4 Built `CompraDetalleEditor` (`src/pages/compras/`) with a per-row
      `tipo` selector (Insumo/Ítem de Gasto/Texto Libre) swapping in an
      `EntityPicker` (`/costos/insumos` or `/costos/items-gasto`) or a
      plain text input, per design.md D2 and the `compras` spec's "Compra
      detalle" requirement.
- [x] 1.5 Built `CompraImpuestoEditor` (`src/pages/compras/`) as a
      repeatable-row editor over the fixed `tipo` vocabulary, with
      auto-computed (editable) Importe, per design.md D3.

## 2. Proveedores (modified)

- [x] 2.1 Extended `ProveedorForm.jsx` with Código, Nombre de Fantasía,
      Condición de IVA (select), Condición de Pago (select, default
      Cuenta Corriente).
- [x] 2.2 Extended `ProveedoresPage.jsx` grid columns with Código and Nombre
      de Fantasía.
- [ ] 2.3 Manually verify: create/edit a proveedor with the new fields
      against `/costos/proveedores`. **Not done in this session** — requires
      a logged-in session against a live backend; needs to be done before
      deploy.

## 3. Ítems de Gasto (new catalog)

- [x] 3.1 `ItemGastoForm.jsx`, `ItemGastoCreatePage.jsx`,
      `ItemGastoEditPage.jsx`, `ItemsGastoPage.jsx` under
      `src/pages/items-gasto/`, mirroring `src/pages/insumos/`'s shape
      exactly (per design.md's Context).
- [x] 3.2 Added `/items-gasto`, `/items-gasto/create`, `/items-gasto/:id/edit`
      routes in `App.jsx` and a menu entry in `AppLayout`.
- [ ] 3.3 Manually verify: create/list/edit/delete an item de gasto.
      **Not done in this session** — see 2.3.

## 4. Compras

- [x] 4.1 `CompraForm.jsx`: master fields (Proveedor picker with
      Condición de Pago auto-defaulting per design.md D6, Tipo de
      Comprobante, Punto de Venta, Número, Fecha, Fecha de Vencimiento,
      Condición de Pago, Orden de Compra picker (optional), Observaciones),
      pairs with `CompraDetalleEditor`, `CompraImpuestoEditor`, and
      `CompraTotalsSummary` (read-only computed Subtotal/IVA/Percepciones/
      Total) rendered alongside it by the Create/Edit pages.
- [x] 4.2 `CompraCreatePage.jsx`: stage detalle/impuestos/adjuntos client
      side; on submit, `POST /costos/compras` with `detalle`+`impuestos`
      inline, then upload staged adjuntos to
      `POST /costos/compras/{id}/adjuntos`, per design.md D1.
- [x] 4.3 `CompraEditPage.jsx`: load the compra plus its detalle/impuestos/
      adjuntos/pagos-aplicados; stage further edits; on save, PUT the
      master record first, then flush staged detalle/impuestos/adjuntos
      changes, surfacing which staged change failed if any does (mirrors
      `FacturaEditPage.jsx`'s former pattern). Existing (already-persisted)
      detalle/impuesto rows are not removable client-side — the backend
      only exposes add endpoints for those, no delete.
- [x] 4.4 `PagosAplicadosPanel.jsx`: read-only list from
      `GET /costos/compras/{id}/pagos`, with an empty state, embedded in
      `CompraEditPage`.
- [x] 4.5 `ComprasPage.jsx`: list with Fecha/Estado filters and the
      Total Facturas Pendientes / Total Gastos summary from
      `GET /costos/cuenta-corriente/resumen`, plus delete-with-confirmation.
- [x] 4.6 Added `/compras`, `/compras/create`, `/compras/:id/edit` routes in
      `App.jsx` and updated the menu entry (was Facturas/Gastos).
- [ ] 4.7 Manually verify: create a compra with a mix of Insumo/Ítem de
      Gasto/Texto Libre detalle lines and multiple impuesto rows in one
      request; edit an existing compra staging a new detalle line, a new
      impuesto row, and an attachment together, save, and confirm all
      three persist; verify a Contado compra shows Pagado/saldo 0 and a
      Cuenta Corriente compra shows Pendiente/saldo=total after creation.
      **Not done in this session** — see 2.3.

## 5. Tesorería / Pagos

- [x] 5.1 `PagoForm.jsx`: Proveedor picker, Fecha, Observaciones, and a
      repeatable Medios de Pago editor (Tipo select gating
      Banco/Número/Fecha de Acreditación for Cheque/Echeq). Deviation:
      `Pago.importe` is computed as the sum of medios rather than a
      separately-entered field, so the "mismatched total" case is
      structurally impossible instead of caught by a submit-time check.
- [x] 5.2 `PagoCreatePage.jsx`, `PagosPage.jsx` (list with Fecha/Proveedor
      filters).
- [x] 5.3 `AplicarPagoModal.jsx`: picks a compra (scoped to the pago's
      proveedor via `EntityPicker`'s new `extraParams` prop) or a pago,
      depending on entry point; enters importe, validated against the
      pago's remaining amount (computed client-side from
      `GET /costos/pagos/{id}/aplicaciones`); posts to
      `POST /costos/pagos/{id}/aplicaciones`.
- [x] 5.4 Wired "Aplicar Pago" action from both the standalone Pagos screen
      and the `compras` edit page's Pagos Aplicados panel (per design.md D4).
- [x] 5.5 Added `/pagos`, `/pagos/create` routes in `App.jsx` and a menu
      entry.
- [ ] 5.6 Manually verify: create a pago split across two medios (one
      Cheque with banking fields), apply it split across two pending
      compras in one request, and confirm both compras' saldo_pendiente
      drop on the next Compras list refresh. **Not done in this session** —
      see 2.3.

## 6. Órdenes de Compra

- [x] 6.1 `OrdenCompraForm.jsx`: Proveedor picker, Número, Fecha, Fecha de
      Entrega Estimada, Observaciones; pairs with
      `OrdenCompraDetalleEditor` (Descripción/Insumo picker, Cantidad
      Pedida, Precio Unitario Estimado) rendered alongside it.
- [x] 6.2 `OrdenCompraCreatePage.jsx`, `OrdenCompraEditPage.jsx` (Estado and
      each línea's Cantidad Recibida read-only), `OrdenesCompraPage.jsx`
      (list). Deviation from the original plan: since `OrdenCompra`'s
      detalle lines live inline on the resource itself (no separate nested
      endpoint, unlike Compra's), Edit sends the full record incl. detalle
      in one PUT rather than a staged multi-request commit.
- [x] 6.3 Reception progress display (Cantidad Recibida/Cantidad Pedida
      per línea, Estado badge) per the `ordenes-compra` spec.
- [x] 6.4 Added `/ordenes-compra`, `/ordenes-compra/create`,
      `/ordenes-compra/:id/edit` routes in `App.jsx` and a menu entry.
- [ ] 6.5 Manually verify: create an orden de compra, then create a compra
      referencing it via the Orden de Compra picker (task 4.1), and
      confirm the orden's Estado/Cantidad Recibida advance on next view.
      **Not done in this session** — see 2.3.

## 7. Libro IVA Compras report

- [x] 7.1 `LibroIvaPage.jsx` under `src/pages/reportes/`: Período filter,
      grid with Neto/IVA 21/10.5/27/Exento/No Gravado/Percepción IVA/
      Percepción IIBB/Sin Discriminar columns, print action (`react-to-print`,
      matching `VentasPage.jsx`/`ProduccionPage.jsx`'s existing pattern).
- [x] 7.2 Added `/reportes/libro-iva-compras` route in `App.jsx` and a menu
      entry alongside the other reportes.
- [ ] 7.3 Manually verify: fetch the report for a période containing at
      least one migrated (`HISTORICO_SIN_DESGLOSE`) compra, and confirm
      its amount appears only in Sin Discriminar. **Not done in this
      session** — see 2.3.

## 8. Dashboard cutover

- [x] 8.1 Updated `DashboardPage.jsx`'s cuenta-corriente summary card to
      source from `GET /costos/cuenta-corriente/resumen` instead of
      `/costos/ctacteprovresumen`.
- [ ] 8.2 Manually verify: dashboard loads with the new summary figures
      and no console errors. **Not done in this session** — see 2.3.

## 9. Legacy retirement (single cutover)

- [x] 9.1 Deleted `src/pages/facturas/**` (`FacturasPage.jsx`,
      `FacturaForm.jsx`, `FacturaCreatePage.jsx`, `FacturaEditPage.jsx`,
      `FacturaPagos.jsx`, `FacturaInsumosDetail.jsx`,
      `InsumosLinesEditor.jsx`, `constants.js`).
- [x] 9.2 Removed `/ctacteprov*` routes from `App.jsx` and the
      Facturas/Gastos menu entry from `AppLayout`.
- [x] 9.3 Grepped the codebase for remaining references to
      `/costos/ctacteprov` or the deleted `facturas` module — none found.
- [x] 9.4 Ran `npm run lint` (Node 20.2 in this sandbox couldn't even run
      the stylish formatter — used Node 22.23.1 via nvm instead): 14
      pre-existing findings, all in files untouched by this change (or, for
      `hooks/index.js`, on a pre-existing line adjacent to the one line I
      added); zero new findings. `npm run build` also passes clean.
- [ ] 9.5 Full manual regression pass per design.md's Migration Plan step 2
      (create/edit/delete across Compras, Pagos, Órdenes de Compra, Ítems
      de Gasto, Libro IVA, Proveedores, Dashboard) against a running
      backend instance before deploy. **Not done in this session** — the
      dev server proxies to a live deployed backend
      (`panacea-produccion-backend.vercel.app`) and every screen sits
      behind login; I don't hold credentials for it and mutating real data
      there without authorization isn't something to do unprompted.
      Confirmed instead that the app boots cleanly (`vite dev` serves, no
      console/module errors) and that `vite build` produces a clean
      production bundle — this is a substitute for, not equivalent to,
      driving the actual screens. A human needs to complete this pass
      before deploy.
- [ ] 9.6 Notify the `panacea-produccion-backend` owner that this repo is
      live against the new endpoints, unblocking that repo's task 10.1.
      **Not done** — depends on 9.5 actually passing first, and is a
      cross-team communication step outside this session's scope.
- [x] 9.7 Ran `openspec validate redesign-cuenta-corriente-proveedor
      --strict` — passes.
