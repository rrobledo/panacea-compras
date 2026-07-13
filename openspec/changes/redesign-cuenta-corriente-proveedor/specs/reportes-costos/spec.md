## MODIFIED Requirements

### Requirement: Dashboard Overview
The system SHALL show a landing dashboard summarizing key production and
sales figures sourced from live backend data.

#### Scenario: View dashboard
- **WHEN** an authenticated user opens the home page
- **THEN** the system SHALL display KPI cards and charts built from
  `/costos/get_produccion_by_category`, `/costos/get_ventas_por_cliente`,
  and `/costos/cuenta-corriente/resumen`, rather than static placeholder
  data or the retired `/costos/ctacteprovresumen` endpoint
