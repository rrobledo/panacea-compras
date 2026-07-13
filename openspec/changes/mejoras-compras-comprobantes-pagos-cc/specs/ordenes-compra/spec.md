## MODIFIED Requirements

### Requirement: List Órdenes de Compra
The system SHALL display purchase orders (`GET /costos/ordenes-compra`)
with Número, Proveedor, Fecha, Fecha de Entrega Estimada, and Estado
(Pendiente/Parcial/Recibida/Cerrada/Cancelada) columns, filterable by
Estado (default Pendiente, with a Todos option) and by Proveedor
(searchable picker). Filtering by Estado SHALL be applied to the
displayed rows regardless of whether the backend honors the `estado`
query parameter, so the default "Pendiente" view is correct even if the
backend returns the full unfiltered list.

#### Scenario: View orden de compra list with default filter
- **WHEN** an authenticated user opens "Órdenes de Compra" without
  changing any filter
- **THEN** the system SHALL request `GET /costos/ordenes-compra` and
  display only the rows whose Estado is Pendiente

#### Scenario: Filter by Estado
- **WHEN** a user selects an Estado other than Pendiente (including
  Todos) and applies the filter
- **THEN** the system SHALL display only rows matching that Estado, or
  every row when Todos is selected

#### Scenario: Filter by Proveedor
- **WHEN** a user picks a Proveedor via the searchable picker and applies
  the filter
- **THEN** the system SHALL request `GET /costos/ordenes-compra` with
  `proveedor_id` set to the picked supplier and display only that
  supplier's órdenes

### Requirement: Create Orden de Compra
The system SHALL allow creating a new orden de compra with Proveedor
(searchable picker), Número, Fecha, Fecha de Entrega Estimada,
Observaciones, and one or more Detalle lines (Descripción and/or Insumo
picker, Cantidad Pedida, Precio Unitario Estimado).

#### Scenario: Successful creation
- **WHEN** a user submits the "Nueva Orden de Compra" form with a
  Proveedor and one or more Detalle lines
- **THEN** the system SHALL POST to `/costos/ordenes-compra`, show a
  success confirmation, and return to the list

### Requirement: Edit Orden de Compra
The system SHALL allow editing an existing orden de compra's master fields
and Detalle lines, with Estado and each Detalle line's Cantidad Recibida
shown read-only.

#### Scenario: Successful update
- **WHEN** a user changes an editable field on an existing orden de compra
  and saves
- **THEN** the system SHALL PUT the updated record to
  `/costos/ordenes-compra/{id}` and show a success confirmation

### Requirement: Recepción progress display
The system SHALL display each orden de compra's reception progress
(Cantidad Recibida vs. Cantidad Pedida per Detalle line, and the parent
Estado) as read-only, since reception is advanced by creating a `Compra`
that references this orden (see the `compras` spec's Orden de Compra
picker).

#### Scenario: View partial reception progress
- **WHEN** a user opens an orden de compra whose Estado is Parcial
- **THEN** the system SHALL display each Detalle line's Cantidad Recibida
  against its Cantidad Pedida, and the Estado badge as Parcial

#### Scenario: View full reception
- **WHEN** an orden de compra's Estado is Recibida
- **THEN** the system SHALL display every Detalle line with Cantidad
  Recibida equal to Cantidad Pedida, and the Estado badge as Recibida
