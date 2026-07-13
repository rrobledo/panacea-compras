## MODIFIED Requirements

### Requirement: List Compras
The system SHALL display purchase comprobantes (`GET /costos/compras`)
with Fecha, Tipo de Comprobante, Proveedor, Número, Estado, Total, and
Saldo Pendiente columns, filterable by Fecha Desde, Fecha Hasta, Estado
(TODOS/PENDIENTE/PARCIAL/PAGADO), and Proveedor (searchable picker), and
showing a summary of Total Facturas Pendientes and Total Gastos en el
Periodo (`GET /costos/cuenta-corriente/resumen`).

#### Scenario: View filtered list with summary
- **WHEN** an authenticated user opens "Compras" with a Fecha Desde, Fecha
  Hasta, and Estado filter applied
- **THEN** the system SHALL request `GET /costos/compras` and
  `GET /costos/cuenta-corriente/resumen` with those filter parameters and
  display both the matching rows and the summary totals

#### Scenario: Filter by Proveedor
- **WHEN** a user picks a Proveedor via the searchable picker and applies
  the filter
- **THEN** the system SHALL request `GET /costos/compras` with
  `proveedor_id` set to the picked supplier, combined with any other
  active filters, and display only that supplier's comprobantes

### Requirement: Create Compra
The system SHALL allow creating a new compra with Proveedor (searchable
picker, defaulting `condicion_pago` from the selected proveedor),
Tipo de Comprobante (Factura A/B/C/M, Nota de Crédito, Nota de Débito,
Ticket, Gasto), Punto de Venta, Número, Fecha, Fecha de Vencimiento,
Condición de Pago (Contado/Cuenta Corriente, overridable), Orden de
Compra (optional searchable picker), Descuento General (%), Importe
Exento, Importe No Gravado, Observaciones, one or more Detalle lines,
zero or more Impuesto lines, and zero or more attachments, all staged
client-side and submitted together. When Condición de Pago is Contado,
the form SHALL additionally show an enabled Pago section (Medios de
Pago); when it is Cuenta Corriente, that section SHALL be disabled and
excluded from submission.

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

#### Scenario: Contado section is enabled and required
- **WHEN** a user sets Condición de Pago to Contado on the "Nueva Compra"
  form
- **THEN** the system SHALL enable the Pago section, requiring at least
  one Medio de Pago whose combined Importe equals the comprobante's
  calculated Total before allowing submission

#### Scenario: Cuenta Corriente disables the Pago section
- **WHEN** a user sets Condición de Pago to Cuenta Corriente on the
  "Nueva Compra" form
- **THEN** the system SHALL disable and hide the Pago section, and SHALL
  NOT include any pago data in the submission

#### Scenario: Contado compra registers comprobante, pago, and aplicación together
- **WHEN** a user submits the form with Condición de Pago = Contado and a
  valid Pago section (medios summing to the comprobante's Total)
- **THEN** the system SHALL, in order: (1) `POST /costos/compras` to
  create the comprobante, (2) `POST /costos/pagos` to create the pago
  with the entered medios, and (3) `POST /costos/pagos/{pagoId}/aplicaciones`
  applying the full Total to the created comprobante, so its resulting
  Saldo Pendiente is 0

#### Scenario: Contado submission blocked with incomplete pago data
- **WHEN** a user attempts to submit a Contado compra without at least
  one Medio de Pago, or whose medios do not sum to the comprobante's
  Total
- **THEN** the system SHALL block submission and show a validation error,
  without calling the backend

#### Scenario: Compra created but pago registration fails
- **WHEN** the comprobante is created successfully but the subsequent
  pago or aplicación call fails
- **THEN** the system SHALL keep the created comprobante, navigate to its
  edit page, and show an error indicating the pago must be completed
  manually from there

#### Scenario: Loading detalle lines from an Orden de Compra
- **WHEN** a user picks a Proveedor's pending Orden de Compra on the
  "Nueva Compra" form
- **THEN** the system SHALL stage a Detalle line per Orden de Compra line,
  prefilled with its Cantidad Pedida and Precio Unitario Estimado, and
  editable per the "Compra detalle" requirement below

### Requirement: Compra detalle
The system SHALL allow adding a Detalle line choosing between three
mutually-exclusive types: Insumo (searchable picker over
`/costos/insumos`), Ítem de Gasto (searchable picker over
`/costos/items-gasto`), or Texto Libre (free-text Descripción). Selecting
an Insumo or Ítem de Gasto SHALL prefill Descripción with the picked
entity's nombre, editable before staging. Every Detalle line SHALL also
capture Cantidad, Precio Unitario, % Descuento, and Alícuota IVA (one of
0%, 2.5%, 5%, 10.5%, 21%, 27%). Every staged (not yet persisted) Detalle
line, regardless of how it was added — manually or loaded from an Orden
de Compra — SHALL allow editing its Cantidad and Precio Unitario inline
in the table before the compra is submitted.

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

#### Scenario: Edit cantidad and precio of a line loaded from an Orden de Compra
- **WHEN** a user opens a Detalle line that was staged from a picked
  Orden de Compra and changes its Cantidad or Precio Unitario before
  submitting the compra
- **THEN** the system SHALL update that staged line's values in place and
  reflect the change in the computed totals, without requiring the line
  to be removed and re-added

#### Scenario: Reject an invalid cantidad or precio
- **WHEN** a user sets a Detalle line's Cantidad to 0 or less, or its
  Precio Unitario to a negative value
- **THEN** the system SHALL block staging or updating that line and show
  a validation error

### Requirement: Compra impuestos
The system SHALL allow adding Impuesto lines to a compra, each capturing
Tipo (a select populated from the fixed vocabulary: Percepción IVA,
Percepción IIBB, Percepción Municipal, Retención IVA, Retención
Ganancias, Retención SUSS, Impuestos Internos) and Importe, entered
directly by the user. This vocabulary SHALL NOT include an IVA type,
since IVA is derived exclusively from each Detalle line's Alícuota IVA
(see "Compra totals calculation") — adding IVA again as an Impuesto line
would double-count it. The system SHALL NOT prompt for Base Imponible or
Porcentaje when adding an Impuesto line. The form SHALL display
read-only computed Subtotal, IVA (grouped by alícuota, derived from
Detalle), Percepciones, Retenciones, Otros Tributos, and Total, computed
client-side from the staged Detalle and Impuesto lines per the
"Compra totals calculation" requirement.

#### Scenario: Add an impuesto line with only tipo and importe
- **WHEN** a user selects a Tipo and enters an Importe
- **THEN** the system SHALL stage an impuesto line with that `tipo` and
  `importe`, without asking for or computing a Base Imponible or
  Porcentaje

#### Scenario: Reject a negative importe outside Nota de Crédito
- **WHEN** a user enters a negative Importe on an Impuesto line and the
  compra's Tipo de Comprobante is not Nota de Crédito
- **THEN** the system SHALL block staging that line and show a validation
  error

## ADDED Requirements

### Requirement: Compra totals calculation
The system SHALL compute a compra's totals client-side following this
algorithm, mirroring what the backend is expected to persist, and using
commercial rounding (round-half-up) to 2 decimals for every monetary
amount:
- Per Detalle line: `subtotalBruto = cantidad * precioUnitario`,
  `descuento = subtotalBruto * (%Descuento/100)`,
  `subtotal = subtotalBruto - descuento`,
  `importeIVA = subtotal * (alicuotaIVA/100)`,
  `total = subtotal + importeIVA`.
- A comprobante-level Descuento General (%) SHALL be applied to the
  summed neto of all Detalle lines before recomputing each line's IVA
  contribution to the total (i.e. bases and IVA are recalculated after
  the general discount, not subtracted from an already-taxed total).
- IVA SHALL be grouped and summed by alícuota (0%, 2.5%, 5%, 10.5%, 21%,
  27%) across all Detalle lines' own `importeIVA`. Impuesto lines SHALL
  NOT contribute to IVA — there is no IVA type in the Impuesto
  vocabulary, precisely to avoid double-counting what Detalle already
  derives.
- Percepciones, Retenciones, and Otros Tributos SHALL each be summed
  independently from the staged Impuesto lines whose `tipo` falls in
  their respective vocabulary group; they SHALL NOT affect the IVA
  computation. Retenciones SHALL be subtracted from the Total (see
  formula below), while Percepciones and Otros Tributos SHALL be added.
- `Total = NetoGravado + IVA + Percepciones + OtrosTributos + Exento +
  NoGravado - Retenciones`, where NetoGravado is the post-general-discount
  sum of Detalle subtotals, and Exento/NoGravado are the compra's Importe
  Exento and Importe No Gravado header fields.

#### Scenario: Totals recompute when a line or header field changes
- **WHEN** a user adds, edits, or removes a staged Detalle or Impuesto
  line, or changes Descuento General, Importe Exento, or Importe No
  Gravado
- **THEN** the system SHALL recompute and display Subtotal, IVA (by
  alícuota and total), Percepciones, Retenciones, Otros Tributos, and
  Total immediately, without a server round-trip

#### Scenario: Descuento General recalculates IVA
- **WHEN** a user sets a Descuento General greater than 0% on a compra
  with staged Detalle lines
- **THEN** the system SHALL reduce each line's taxable base by that
  percentage before computing IVA, so the displayed IVA total reflects
  the discounted base, not the original one

#### Scenario: Amounts round to 2 decimals with commercial rounding
- **WHEN** any computed monetary amount has more than 2 decimal digits
  internally
- **THEN** the system SHALL display and submit it rounded to 2 decimals
  using round-half-up, not banker's rounding

#### Scenario: Reject an alícuota outside the admitted set
- **WHEN** a user attempts to set a Detalle line's Alícuota IVA to a value
  other than 0%, 2.5%, 5%, 10.5%, 21%, or 27%
- **THEN** the system SHALL block staging that line and show a validation
  error
