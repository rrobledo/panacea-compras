## ADDED Requirements

### Requirement: List Órdenes de Compra
The system SHALL display purchase orders (`GET /costos/ordenes-compra`)
with Número, Proveedor, Fecha, Fecha de Entrega Estimada, and Estado
(Pendiente/Parcial/Recibida/Cerrada/Cancelada) columns.

#### Scenario: View orden de compra list
- **WHEN** an authenticated user opens "Órdenes de Compra"
- **THEN** the system SHALL display all órdenes returned by the backend in
  a sortable, searchable grid

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
