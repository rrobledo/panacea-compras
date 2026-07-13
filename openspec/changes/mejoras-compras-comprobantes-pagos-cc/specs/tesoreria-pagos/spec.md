## MODIFIED Requirements

### Requirement: List Pagos
The system SHALL display payments under the "Pagos en Cuenta Corriente"
screen (`GET /costos/pagos`) with Fecha, Proveedor, Importe, and Estado
columns, filterable by Fecha Desde, Fecha Hasta, and Proveedor.

#### Scenario: View filtered pago list
- **WHEN** an authenticated user opens "Pagos en Cuenta Corriente" with a
  Fecha Desde/Fecha Hasta filter applied
- **THEN** the system SHALL request `GET /costos/pagos` with those filter
  parameters and display the matching rows

### Requirement: Create Pago with multiple medios
The system SHALL allow creating a new pago, under "Pagos en Cuenta
Corriente", starting from a Proveedor (searchable picker). Once a
Proveedor is picked, the system SHALL fetch and display that Proveedor's
pending comprobantes (Estado Pendiente or Parcial) with an editable
"Importe a Aplicar" field per comprobante. The sum of those importes
SHALL be shown as the Total a Cubrir, and the Medios de Pago section
(Tipo: Transferencia/Cheque/Echeq/Efectivo/Tarjeta, and Importe per
medio; Cheque and Echeq additionally require Banco, Número, and Fecha de
Acreditación) SHALL only accept entries once at least one comprobante has
a non-zero Importe a Aplicar, or the user may proceed with zero
comprobantes selected to record an unapplied pago (e.g. an anticipo). The
form SHALL display a read-only computed total (sum of medios' Importe)
that SHALL match the Total a Cubrir when one or more comprobantes are
selected.

#### Scenario: Pick a proveedor and see its pending comprobantes
- **WHEN** a user picks a Proveedor on the "Nuevo Pago" form
- **THEN** the system SHALL request `GET /costos/compras` filtered by that
  proveedor and Estado Pendiente/Parcial, and display the results with an
  editable Importe a Aplicar per row

#### Scenario: Apply the pago to multiple comprobantes on creation
- **WHEN** a user enters an Importe a Aplicar on two of the proveedor's
  pending comprobantes, adds one or more Medios de Pago summing to the
  same total, and submits
- **THEN** the system SHALL `POST /costos/pagos` with those medios, and
  then `POST /costos/pagos/{id}/aplicaciones` with
  `[{compra_id, importe}, {compra_id, importe}]` for the two selected
  comprobantes, in the same operation

#### Scenario: Create a pago with a single medio
- **WHEN** a user submits the "Nuevo Pago" form with a Proveedor, Fecha,
  and one Efectivo medio, with no comprobante selected
- **THEN** the system SHALL POST to `/costos/pagos` with that single
  `medios` entry and no aplicaciones, show a success confirmation, and
  return to the list

#### Scenario: Split a pago across two medios
- **WHEN** a user adds a Transferencia medio of 500 and a Cheque medio of
  500 (with Banco, Número, and Fecha de Acreditación filled in) to the
  same pago
- **THEN** the system SHALL POST both entries in the `medios` array of the
  same `POST /costos/pagos` request

#### Scenario: Block submitting a cheque medio without banking fields
- **WHEN** a user adds a Cheque or Echeq medio without Banco, Número, or
  Fecha de Acreditación
- **THEN** the system SHALL block adding that medio and show a validation
  error, without calling the backend

#### Scenario: Block submitting a mismatched medios total
- **WHEN** one or more comprobantes are selected and the sum of the
  entered medios' Importe does not equal the sum of the selected
  comprobantes' Importe a Aplicar
- **THEN** the system SHALL block submission and show a validation error

#### Scenario: Pago created but aplicación registration fails
- **WHEN** the pago is created successfully but the subsequent
  `POST /costos/pagos/{id}/aplicaciones` call fails
- **THEN** the system SHALL keep the created pago, show an error, and let
  the user complete the application later from "Aplicar a Compra"

### Requirement: Apply a pago to one or more compras
The system SHALL allow applying an existing pago (full or split amount)
against one or more pending compras from that pago's detail view via
"Aplicar a Compra", and SHALL allow initiating the same action from a
compra's edit page (see the `compras` spec's "Pagos Aplicados panel"
requirement). This SHALL remain available as a manual path even though
the "Create Pago with multiple medios" flow now applies most pagos to
their comprobantes at creation time — it is the recovery path when that
combined creation fails partway, and the only path for applying a
pre-existing unapplied pago. The system SHALL compute the pago's
remaining (unapplied) amount client-side as its Importe minus the sum of
its already-applied aplicaciones.

#### Scenario: Apply one pago to multiple facturas
- **WHEN** a user opens an existing pago, picks two pending compras from
  that pago's proveedor via a searchable picker, and enters an importe to
  apply to each
- **THEN** the system SHALL POST
  `[{compra_id, importe}, {compra_id, importe}]` to
  `/costos/pagos/{id}/aplicaciones` in a single request, show a success
  confirmation, and refresh the pago's computed remaining amount

#### Scenario: Block applying more than the pago's unallocated amount
- **WHEN** the sum of importes entered across the compras being applied to
  exceeds the pago's computed remaining amount
- **THEN** the system SHALL block submission and show a validation error
