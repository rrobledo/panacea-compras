## ADDED Requirements

### Requirement: List Compras
The system SHALL display purchase comprobantes (`GET /costos/compras`)
with Fecha, Tipo de Comprobante, Proveedor, Número, Estado, Total, and
Saldo Pendiente columns, filterable by Fecha Desde, Fecha Hasta, and
Estado (TODOS/PENDIENTE/PARCIAL/PAGADO), and showing a summary of Total
Facturas Pendientes and Total Gastos en el Periodo
(`GET /costos/cuenta-corriente/resumen`).

#### Scenario: View filtered list with summary
- **WHEN** an authenticated user opens "Compras" with a Fecha Desde, Fecha
  Hasta, and Estado filter applied
- **THEN** the system SHALL request `GET /costos/compras` and
  `GET /costos/cuenta-corriente/resumen` with those filter parameters and
  display both the matching rows and the summary totals

### Requirement: Create Compra
The system SHALL allow creating a new compra with Proveedor (searchable
picker, defaulting `condicion_pago` from the selected proveedor),
Tipo de Comprobante (Factura A/B/C/M, Nota de Crédito, Nota de Débito,
Ticket, Gasto), Punto de Venta, Número, Fecha, Fecha de Vencimiento,
Condición de Pago (Contado/Cuenta Corriente, overridable), Orden de Compra
(optional searchable picker), Observaciones, one or more Detalle lines,
zero or more Impuesto lines, and zero or more attachments, all staged
client-side and submitted together.

#### Scenario: Successful creation with detalle and impuestos
- **WHEN** a user submits the "Nueva Compra" form with all required master
  fields, one or more staged Detalle lines, and one or more staged
  Impuesto lines
- **THEN** the system SHALL POST to `/costos/compras` with `detalle` and
  `impuestos` arrays in the same request body, show a success
  confirmation, and return to the list

#### Scenario: Staging a detalle line before the compra exists
- **WHEN** a user is filling out the "Nueva Compra" form and adds a
  detalle line
- **THEN** the system SHALL add the line to a displayed list marked as
  pending, without calling the backend (see the "Compra detalle" and
  "Compra impuestos" requirements below for line-level behavior)

#### Scenario: Staging an attachment before the compra exists
- **WHEN** a user selects a file to attach on the "Nueva Compra" form
  before submitting
- **THEN** the system SHALL hold the file client-side as pending, and only
  upload it (`POST /costos/compras/{id}/adjuntos`) after the compra is
  successfully created

#### Scenario: Contado compra is immediately settled
- **WHEN** a user submits the form with Condición de Pago = Contado
- **THEN** the created compra's Estado SHALL display as Pagado with
  Saldo Pendiente = 0, matching the backend-computed values on the
  subsequent list refresh

### Requirement: Edit Compra
The system SHALL allow editing an existing compra's master fields, and
SHALL show its Detalle, Impuestos, Adjuntos, and Pagos Aplicados panels
below the edit form. Saving the form SHALL persist the master fields and
every staged change in the Detalle, Impuestos, and Adjuntos panels
together, rather than persisting each change as it's made.

#### Scenario: Successful update with no pending detail changes
- **WHEN** a user changes a master field on an existing compra and saves,
  with no pending Detalle, Impuestos, or Adjuntos changes
- **THEN** the system SHALL PUT the updated record to
  `/costos/compras/{id}` and show a success confirmation

#### Scenario: Successful update with pending detail changes
- **WHEN** a user saves an existing compra that has staged Detalle,
  Impuestos, and/or Adjuntos changes
- **THEN** the system SHALL PUT the master record first, and only if that
  succeeds, persist every staged change, reporting success once all of it
  is persisted

#### Scenario: A staged detail change fails to persist
- **WHEN** the master fields save successfully but a staged Detalle,
  Impuestos, or Adjuntos change fails to persist
- **THEN** the system SHALL keep the user on the edit page, indicate which
  change failed, and keep it staged so the user can retry by saving again

#### Scenario: Discarding pending changes
- **WHEN** a user has staged but unsaved Detalle, Impuestos, or Adjuntos
  changes and attempts to leave the edit page (e.g. via "Cancelar")
- **THEN** the system SHALL prompt for confirmation before discarding the
  pending changes

### Requirement: Delete Compra
The system SHALL allow deleting a compra from the list after confirmation.

#### Scenario: Confirmed deletion
- **WHEN** a user confirms deletion of a compra row
- **THEN** the system SHALL DELETE `/costos/compras/{id}` and refresh the
  list

### Requirement: Compra detalle
The system SHALL allow adding a Detalle line choosing between three
mutually-exclusive types: Insumo (searchable picker over
`/costos/insumos`), Ítem de Gasto (searchable picker over
`/costos/items-gasto`), or Texto Libre (free-text Descripción). Selecting
an Insumo or Ítem de Gasto SHALL prefill Descripción with the picked
entity's nombre, editable before staging. Every Detalle line SHALL also
capture Cantidad, Precio Unitario, Descuento, and Alícuota IVA.

#### Scenario: Add an Insumo detalle line
- **WHEN** a user selects "Insumo" as the tipo, picks an insumo via the
  search picker, and does not edit the prefilled Descripción
- **THEN** the system SHALL stage a detalle line with `tipo=INSUMO`,
  `insumo_id` set, and `descripcion` equal to the picked insumo's nombre

#### Scenario: Add an Ítem de Gasto detalle line
- **WHEN** a user selects "Ítem de Gasto" as the tipo and picks an item via
  the search picker
- **THEN** the system SHALL stage a detalle line with
  `tipo=ITEM_GASTO` and `item_gasto_id` set

#### Scenario: Add a Texto Libre detalle line
- **WHEN** a user selects "Texto Libre" as the tipo and types a
  Descripción
- **THEN** the system SHALL stage a detalle line with `tipo=LIBRE` and no
  catalog reference

#### Scenario: Block submitting a Texto Libre line without descripcion
- **WHEN** a user attempts to stage a `tipo=LIBRE` detalle line with an
  empty Descripción
- **THEN** the system SHALL block adding the line and show a validation
  error, without calling the backend

### Requirement: Compra impuestos
The system SHALL allow adding Impuesto lines to a compra, each capturing
Tipo (a select populated from the fixed vocabulary: IVA 21%, IVA 10.5%,
IVA 27%, Percepción IVA, Percepción IIBB, Percepción Municipal, Retención
IVA, Retención Ganancias, Retención SUSS, Impuestos Internos), Base
Imponible, Porcentaje, and Importe (auto-computed from Base Imponible ×
Porcentaje but editable). The form SHALL display read-only computed
Subtotal, IVA, Percepciones, and Total, summed client-side from the
staged Detalle and Impuesto lines, mirroring what the backend computes.

#### Scenario: Add an impuesto line with auto-computed importe
- **WHEN** a user selects Tipo = IVA 21%, enters a Base Imponible, and
  leaves Importe untouched
- **THEN** the system SHALL compute and display Importe as Base Imponible
  × 21%, staged as an impuesto line

#### Scenario: Override the computed importe
- **WHEN** a user edits the auto-computed Importe value before staging
  the line
- **THEN** the system SHALL stage the line with the user-entered Importe
  instead of the computed value

### Requirement: Compra adjuntos
The system SHALL allow attaching files (e.g. receipt photos) to a compra,
uploaded as real file uploads rather than embedded as base64. Existing
attachments SHALL be listed with a preview/download link.

#### Scenario: Upload a receipt photo to an existing compra
- **WHEN** a user selects a file on an existing compra's edit page and
  saves
- **THEN** the system SHALL POST the file to
  `/costos/compras/{id}/adjuntos` as part of the staged-changes commit and
  display it in the Adjuntos list once persisted

#### Scenario: A failed upload stays retryable
- **WHEN** an attachment upload fails during the staged-changes commit
- **THEN** the system SHALL keep the compra's other successfully-persisted
  changes intact, and keep the failed attachment staged so the user can
  retry it

### Requirement: Pagos Aplicados panel
The system SHALL display, on an existing compra's edit page, every pago
applied to that compra.

#### Scenario: View applied pagos
- **WHEN** a user opens an existing compra's edit page
- **THEN** the system SHALL fetch and display
  `GET /costos/compras/{id}/pagos`, showing each pago's Fecha and the
  Importe applied to this compra

#### Scenario: No applied pagos
- **WHEN** a compra has no applied pagos
- **THEN** the system SHALL display an empty state instead of an empty
  table
