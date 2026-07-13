## ADDED Requirements

### Requirement: Libro IVA Compras report
The system SHALL display a read-only Libro IVA Compras report
(`GET /costos/libro-iva-compras`) filterable by Período (year-month), with
one row per compra showing Neto, IVA 21%, IVA 10.5%, IVA 27%, Exento, No
Gravado, Percepción IVA, Percepción IIBB, and a Sin Discriminar column for
amounts migrated from the legacy schema without a tax breakdown.

#### Scenario: View the report for a período
- **WHEN** a user opens "Libro IVA Compras" and selects a Período
- **THEN** the system SHALL request `GET /costos/libro-iva-compras` with
  that período and display one row per compra with each tax column
  populated from the response

#### Scenario: Historical compras show as undiscriminated
- **WHEN** a compra in the selected período was migrated from the legacy
  schema and only has an undiscriminated tax amount
- **THEN** the system SHALL display that amount in the Sin Discriminar
  column, not fabricate it into one of the discriminated IVA/percepción
  columns

#### Scenario: Print the report
- **WHEN** a user clicks the print action
- **THEN** the system SHALL open the browser print dialog for the report
  content, consistent with the other reportes-costos screens
