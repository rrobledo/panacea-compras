## MODIFIED Requirements

### Requirement: List Proveedores
The system SHALL display a list of suppliers (`GET /costos/proveedores`)
with Código, Nombre, Nombre de Fantasía, CUIT, and Teléfono columns, in
Spanish.

#### Scenario: View supplier list
- **WHEN** an authenticated user opens "Proveedores"
- **THEN** the system SHALL display all suppliers returned by the backend
  in a sortable, searchable grid

### Requirement: Create Proveedor
The system SHALL allow creating a new supplier with Código, Nombre,
Nombre de Fantasía, CUIT, Condición de IVA (Responsable Inscripto/
Monotributo/Exento/Consumidor Final), Condición de Pago (Contado/Cuenta
Corriente, default Cuenta Corriente), Teléfono, Email, and Dirección.

#### Scenario: Successful creation
- **WHEN** a user submits the "Nuevo Proveedor" form with a required
  Nombre, CUIT, and Condición de IVA
- **THEN** the system SHALL POST to `/costos/proveedores`, show a success
  confirmation, and return to the supplier list

#### Scenario: Invalid email format
- **WHEN** a user enters a malformed value in the Email field
- **THEN** the system SHALL block submission and show a validation error
  on that field

#### Scenario: Reject unknown condicion_iva
- **WHEN** a user submits a Condición de IVA value outside the fixed
  vocabulary
- **THEN** the system SHALL block submission and show a validation error
  on that field

### Requirement: Edit Proveedor
The system SHALL allow editing an existing supplier's fields, including
Código, Nombre de Fantasía, Condición de IVA, and Condición de Pago, with
`id` shown read-only.

#### Scenario: Successful update
- **WHEN** a user changes a field on an existing supplier and saves
- **THEN** the system SHALL PUT the updated record to
  `/costos/proveedores/{id}` and show a success confirmation
