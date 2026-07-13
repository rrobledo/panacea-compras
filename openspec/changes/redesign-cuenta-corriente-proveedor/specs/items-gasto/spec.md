## ADDED Requirements

### Requirement: List Ítems de Gasto
The system SHALL display a list of expense-concept catalog entries
(`GET /costos/items-gasto`) with Código, Nombre, and Activo columns,
filterable by Nombre (substring).

#### Scenario: View item de gasto list
- **WHEN** an authenticated user opens "Ítems de Gasto"
- **THEN** the system SHALL display all items returned by the backend in a
  sortable, searchable grid

### Requirement: Create Ítem de Gasto
The system SHALL allow creating a new item de gasto with Código
(optional) and Nombre.

#### Scenario: Successful creation
- **WHEN** a user submits the "Nuevo Ítem de Gasto" form with a Nombre
- **THEN** the system SHALL POST to `/costos/items-gasto`, show a success
  confirmation, and return to the list

### Requirement: Edit Ítem de Gasto
The system SHALL allow editing an existing item de gasto's fields,
including toggling Activo, with `id` shown read-only.

#### Scenario: Successful update
- **WHEN** a user changes a field on an existing item de gasto and saves
- **THEN** the system SHALL PUT the updated record to
  `/costos/items-gasto/{id}` and show a success confirmation

### Requirement: Delete Ítem de Gasto
The system SHALL allow deleting an item de gasto from the list after
confirmation.

#### Scenario: Confirmed deletion
- **WHEN** a user confirms deletion of an item de gasto row
- **THEN** the system SHALL DELETE `/costos/items-gasto/{id}` and refresh
  the list
