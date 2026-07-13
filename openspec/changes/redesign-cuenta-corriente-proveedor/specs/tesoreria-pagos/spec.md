## ADDED Requirements

### Requirement: List Pagos
The system SHALL display payments (`GET /costos/pagos`) with Fecha,
Proveedor, Importe, and Estado columns, filterable by Fecha Desde, Fecha
Hasta, and Proveedor.

#### Scenario: View filtered pago list
- **WHEN** an authenticated user opens "Pagos" with a Fecha Desde/Fecha
  Hasta filter applied
- **THEN** the system SHALL request `GET /costos/pagos` with those filter
  parameters and display the matching rows

### Requirement: Create Pago with multiple medios
The system SHALL allow creating a new pago with Proveedor (searchable
picker), Fecha, Observaciones, and one or more Medios de Pago, each
capturing Tipo (Transferencia/Cheque/Echeq/Efectivo/Tarjeta) and Importe;
Cheque and Echeq medios additionally require Banco, Número, and Fecha de
Acreditación. The form SHALL display a read-only computed total (sum of
medios' Importe) that SHALL match the Pago's Importe.

#### Scenario: Create a pago with a single medio
- **WHEN** a user submits the "Nuevo Pago" form with a Proveedor, Fecha,
  and one Efectivo medio
- **THEN** the system SHALL POST to `/costos/pagos` with that single
  `medios` entry, show a success confirmation, and return to the list

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
- **WHEN** the sum of the entered medios' Importe does not equal the
  pago's total Importe field at submit time
- **THEN** the system SHALL block submission and show a validation error

### Requirement: Apply a pago to one or more compras
The system SHALL allow applying an existing pago (full or split amount)
against one or more pending compras from that pago's detail view, and
SHALL allow initiating the same action from a compra's edit page (see the
`compras` spec's "Pagos Aplicados panel" requirement). The system SHALL
compute the pago's remaining (unapplied) amount client-side as its
Importe minus the sum of its already-applied aplicaciones.

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
