## Context

`panacea-produccion` is the only consumer of the backend's
`/costos/ctacteprov*` endpoints. The backend change of the same name
(`panacea-produccion-backend/openspec/changes/redesign-cuenta-corriente-proveedor`,
already implemented, tasks 1–9 done) has shipped the new
`/costos/compras*`, `/costos/pagos*`, `/costos/ordenes-compra*`,
`/costos/items-gasto*`, `/costos/cuenta-corriente*`, and
`/costos/libro-iva-compras` endpoints additively, alongside the still-live
legacy ones. Its own task list is explicitly blocked on this repo (task
10.1: "Confirm `panacea-produccion` is deployed against the new endpoints
... before proceeding" to removing the legacy routes).

Constraints shaping this design:
- No global/cached state in this app — every screen owns its fetch via
  `createCrudService`/`api` (`src/services/api.js`). There is nothing like
  a Redux store or React Query cache to invalidate; the cutover is a
  per-screen rewrite, not a data-layer migration.
- The existing `facturas-gastos` capability already established a
  "stage nested changes, commit together with the master save" pattern
  (`FacturaEditPage.jsx` + `FacturaPagos.jsx` + `InsumosLinesEditor.jsx`):
  Pagos and Detalle de Insumos are edited in local component state and
  only hit the backend after the parent record's PUT succeeds. The new
  `Compra` shape has the same nesting problem (`detalle`, `impuestos`,
  `adjuntos`) one level deeper, so this pattern is reused rather than
  reinvented.
- Forms use `react-hook-form` + `zod` + a shared `Field` component
  (`src/components/ui`); entity references use `EntityPicker` (a
  search-first autocomplete over a REST resource, e.g.
  `resource="/costos/proveedores"`). Catalog CRUD screens (Insumos) follow
  a fixed three-file shape: `<X>Page.jsx` (grid), `<X>Form.jsx`
  (react-hook-form + zod), `<X>Create/EditPage.jsx` (thin wrappers wiring
  the form to `createCrudService`).
- No automated frontend test suite exists in this repo; verification is
  manual against a running backend (see `SKILL.md`).
- There is no object storage anywhere in the stack today; `CompraAdjunto`
  is the first feature requiring a real file upload rather than the
  base64-in-JSON pattern `ImageField` currently uses for
  `Factura.image`/`image2`.

## Goals / Non-Goals

**Goals:**
- Replace every `/costos/ctacteprov*` call with the corresponding
  `/costos/compras*` / `/costos/pagos*` call, so the backend can proceed
  past task 10.1 and retire the legacy routes.
- Reuse the existing stage-then-commit editing pattern for `Compra`'s
  nested `detalle`/`impuestos`/`adjuntos`, rather than introducing a new
  editing paradigm.
- Ship `ordenes-compra`, `items-gasto`, and `libro-iva-compras` as new
  screens following the existing catalog/report screen shapes exactly, so
  they're unsurprising to maintain.
- Cut over `proveedores` and the Dashboard summary to the new fields/
  endpoints without touching unaffected screens (Insumos, Productos,
  Planning, Programación, other reportes).

**Non-Goals:**
- No client-side accounting UI (centro de costo / cuenta contable) — those
  fields stay unexposed, matching the backend's reserved nullable FKs.
- No multi-currency fields.
- No goods-receipt UI beyond displaying `OrdenCompra` reception progress
  (`cantidad_recibida`/`cantidad_pedida` per línea) — no separate receiving
  workflow screen.
- No dual-write or per-screen incremental rollout: this ships as one
  deploy that fully replaces the ctacteprov screens, mirroring the
  backend design's own D6 principle ("no dual-write / gradual per-screen
  rollout") applied to the frontend side of the same cutover.
- No automated test suite is introduced as part of this change; this
  repo has none today and adding one is a separate concern.

## Decisions

**D1 — Reuse the stage-then-commit pattern from `facturas-gastos` for
`Compra.detalle`/`impuestos`/`adjuntos`, one level deeper than before.**
`FacturaEditPage.jsx` already proves the pattern for two nested
collections (Pagos, Detalle de Insumos): edit locally, PUT the master
record first, then flush every staged nested change, surfacing which one
failed if any does. `ComprasEditPage`/`ComprasCreatePage` extend this to
three nested collections. On create, all three are staged (no `Compra.id`
exists yet) and sent together — `detalle` and `impuestos` inline in the
`POST /costos/compras` body (per the `compras` spec), `adjuntos` uploaded
via `POST /costos/compras/{id}/adjuntos` immediately after, once the id
exists.
*Alternative considered*: a wizard/multi-step create flow (basic fields →
detalle → impuestos → adjuntos as separate steps with their own saves) —
rejected, it would abandon the existing "one form, one save" mental model
users already have from Facturas/Gastos for no functional gain at this
data volume.

**D2 — `CompraDetalle`'s three-way `tipo` (`INSUMO`/`ITEM_GASTO`/`LIBRE`)
extends `InsumosLinesEditor` into a new `CompraDetalleEditor` with a
per-row type selector, not three separate line-item lists.** Each row has
a `tipo` toggle; selecting `INSUMO` or `ITEM_GASTO` swaps in an
`EntityPicker` (`/costos/insumos` or `/costos/items-gasto` respectively)
and snapshots the picked entity's `nombre` into `descripcion` (editable
override, mirroring the backend's own snapshot behavior in
`compra_service.py`); selecting `LIBRE` swaps in a plain text input for
`descripcion`. This keeps a single flat `detalle` array in form state,
matching the `POST /costos/compras` body shape directly.
*Alternative considered*: three separate add-line UIs (one per tipo)
feeding one list — rejected, more component surface for the same three
mutually-exclusive fields the backend already validates as one row shape.

**D3 — `CompraImpuestoEditor` is a repeatable-row editor over the fixed
vocabulary, not per-tax-type fields.** One row = `tipo` (select, fixed
vocabulary from the `compras` spec), `base_imponible`, `porcentaje`,
`importe` (auto-computed as `base_imponible * porcentaje / 100`, but
editable — some tipos like `IMPUESTOS_INTERNOS` don't cleanly fit a
percentage-of-base model). `subtotal`/`iva`/`percepciones`/`total` shown
in the form are read-only, client-side sums mirroring what the backend
will (re)compute — never sent as client-authored totals.
*Alternative considered*: fixed fields per known tax type (a `iva_21`
input, a `iva_10_5` input, etc.) — rejected, directly reintroduces the
rigidity `CompraImpuesto`'s generic shape was designed to remove; a new
tax type would require a frontend code change instead of just appearing
in the vocabulary dropdown.

**D4 — Payments are a standalone `pagos` screen (list/create), not nested
under a compra, because `PagoAplicacion` is N:M.** A `Pago` can apply to
multiple compras and a compra can have multiple pagos, so a `Pago` isn't
owned by one `Compra` the way the old flat model implied. `PagosPage`
(list/create, `condicion_pago`-agnostic) is a new top-level screen; the
compra edit page gets a read-only "Pagos Aplicados" panel
(`GET /costos/compras/{id}/pagos`) plus an "Aplicar Pago" action that
opens a picker over existing pagos with remaining unallocated amount and
posts to `POST /costos/pagos/{id}/aplicaciones`. Creating a brand-new pago
and immediately applying it happens as two calls in sequence from the
Pagos screen (create pago, then apply), not staged — `Pago` doesn't have
the "doesn't exist yet" problem `Compra.detalle` has, since a pago is
useful (and payable) before it's applied to anything.
*Alternative considered*: keep Pagos nested under the compra edit page
like today's `FacturaPagos.jsx` — rejected, doesn't model a pago applying
to multiple facturas at once, which is an explicit goal of the backend
redesign (`tesoreria-pagos` spec's "Apply one pago to multiple facturas"
scenario).

**D5 — `CompraAdjunto` uses a new `FileUploadField` (real
`File`/`FormData` upload), not an extension of `ImageField`.**
`ImageField` encodes to base64 and stores it as a JSON string field,
matching the legacy `image`/`image2` columns — a pattern the backend
change explicitly removes (D7 in the backend design: attachments move
fully out of the database). `FileUploadField` holds a `File` object (or,
for staged pre-create rows, a pending-upload marker) and is committed via
`POST /costos/compras/{id}/adjuntos` as multipart form data, following D1.
A failed upload (per the `compras` spec) doesn't roll back the `Compra`,
so the UI keeps the failed attachment in a retryable state rather than
discarding it.
*Alternative considered*: keep `ImageField`/base64 and let the backend
decode-and-reupload — rejected, that's not what the backend implemented;
`POST /costos/compras/{id}/adjuntos` expects a file upload, not base64
JSON.

**D6 — `condicion_pago` defaults from the selected proveedor, client-side,
matching the backend's own default-if-not-provided behavior.** When a
proveedor is picked via `EntityPicker` on the Compra form, the form
fetches that proveedor's `condicion_pago` and prefills the field
(still editable per-compra), so the "Contado compra settles immediately /
Cuenta Corriente compra starts pending" behavior (per the `compras` spec)
is visible before submit rather than only discovered after.
*Alternative considered*: leave `condicion_pago` blank and let the backend
silently default it — rejected, the resulting `estado`/`saldo_pendiente`
would surprise the user on the next list view with no visible cause.

**D7 — `OrdenCompra` reception progress is read-only in this change, no
receiving workflow screen.** `OrdenCompraPage`/`OrdenCompraEditPage` show
`estado` and each detalle row's `cantidad_recibida`/`cantidad_pedida` as
a progress indicator; the actual increment happens server-side as a side
effect of `POST /costos/compras` with `orden_compra_id` set (per the
`ordenes-compra` spec), which the Compra form supports via an optional
`EntityPicker` on `/costos/ordenes-compra`.
*Alternative considered*: a dedicated "recibir mercadería" screen that
lets a user check off OC lines directly — rejected as out of scope; the
backend has no endpoint for it (reception is inferred from Compra
creation, matched by descripción), so building one now would require
backend work outside this proposal's scope.

**D8 — Route paths mirror the existing `/insumos`, `/proveedores`
convention (plural noun, no `costos/` prefix in the frontend URL, even
though the backend path has one), for `compras`, `pagos`,
`ordenes-compra`, and `items-gasto`.** `libro-iva-compras` is added under
the existing `/reportes/*` prefix alongside the other read-only reports.
*Alternative considered*: mirror the backend's `/costos/*` prefix in
frontend routes too — rejected, no existing frontend route does this
(`/ctacteprov` calls `/costos/ctacteprov` but the frontend route omits the
prefix); consistency with the existing convention wins over mirroring the
API path.

## Risks / Trade-offs

- **[Risk] This frontend cutover is the last gate before the backend
  removes `/costos/ctacteprov*`** (backend task 10.1) → *Mitigation*:
  manually verify every new screen against a running backend instance
  before this deploys, and confirm with whoever owns the backend repo
  before they proceed to task 10.2.
- **[Risk] `CompraDetalleEditor`'s three-way tipo selector is more complex
  than the single-tipo `InsumosLinesEditor` it replaces** → *Mitigation*:
  keep the per-row shape flat (one `tipo` field gates which picker/input
  renders) rather than three parallel editors, per D2.
- **[Risk] No automated tests catch regressions in the staged-commit flow
  once a third nested collection (`impuestos`) is added** → *Mitigation*:
  manual verification checklist in `tasks.md` explicitly exercises create
  and edit flows with staged detalle + impuestos + adjuntos together, not
  just each in isolation.
- **[Trade-off] `Pago` creation and `PagoAplicacion` are two sequential
  network calls from the Pagos screen (D4), not one atomic staged
  operation** → accepted, since a pago can legitimately exist unapplied
  (e.g. an advance payment); this mirrors how the backend itself exposes
  them as separate endpoints.

## Migration Plan

1. Build the new screens (`compras`, `pagos`, `ordenes-compra`,
   `items-gasto`, `reportes/libro-iva-compras`) and the `proveedores`/
   Dashboard field and endpoint changes against the already-live new
   backend endpoints, without removing the old `facturas-gastos` screens
   yet, so both can be manually compared during development.
2. Manually verify each new screen end-to-end against a running backend
   (create/edit/delete compras with detalle+impuestos+adjuntos, pagos
   with split medios applied across multiple compras, órdenes de compra
   reception progress, libro IVA report, proveedor fields, dashboard
   summary) per the checklist in `tasks.md`.
3. Remove `src/pages/facturas/**`, its routes in `App.jsx`, and its menu
   entries in the same deploy that ships the new screens — no parallel
   "both live" period in production, per D goal of a single cutover.
4. Deploy. Notify whoever owns `panacea-produccion-backend` that this
   repo is live against the new endpoints, unblocking their task 10.1.
5. **Rollback**: since the backend keeps `/costos/ctacteprov*` live and
   unmodified until it separately completes task 10.2, reverting this
   frontend deploy to the previous build fully restores the old flow with
   no backend-side action needed.

## Open Questions

- Whether `PagosPage` should show a proveedor-scoped "cuenta corriente"
  view (ledger + pending facturas + apply-payment in one screen) versus
  today's separate Facturas-list-with-inline-pago-button pattern —
  deferred to `tasks.md` sequencing; start with the minimal separate-screen
  version (D4) and revisit if it proves clunky in manual testing.
- Whether the Dashboard needs a new KPI card for `OrdenCompra`/Libro IVA
  or just the existing cuenta-corriente summary card swapped to the new
  endpoint — deferred; start with the swap only (in scope), treat new
  cards as a follow-up.
