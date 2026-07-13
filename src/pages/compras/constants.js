export const TIPOS_COMPROBANTE = [
  { value: 'FACTURA_A', label: 'Factura A' },
  { value: 'FACTURA_B', label: 'Factura B' },
  { value: 'FACTURA_C', label: 'Factura C' },
  { value: 'FACTURA_M', label: 'Factura M' },
  { value: 'NOTA_CREDITO', label: 'Nota de Crédito' },
  { value: 'NOTA_DEBITO', label: 'Nota de Débito' },
  { value: 'TICKET', label: 'Ticket' },
  { value: 'GASTO', label: 'Gasto' },
];

export const CONDICIONES_PAGO = [
  { value: 'CONTADO', label: 'Contado' },
  { value: 'CUENTA_CORRIENTE', label: 'Cuenta Corriente' },
];

export const ESTADOS_COMPRA = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'PARCIAL', label: 'Parcial' },
  { value: 'PAGADO', label: 'Pagado' },
];

export const DETALLE_TIPOS = [
  { value: 'INSUMO', label: 'Insumo' },
  { value: 'ITEM_GASTO', label: 'Ítem de Gasto' },
  { value: 'LIBRE', label: 'Texto Libre' },
];

// Alícuotas de IVA admitidas por el motor de cálculo (design.md D6). El IVA
// se deriva por renglón de Detalle a partir de esta lista — no existe un
// tipo de Impuesto para IVA, para no duplicarlo.
export const ALICUOTAS_IVA = [0, 2.5, 5, 10.5, 21, 27];

// Percepciones/Retenciones/Otros Tributos únicamente — el IVA queda fuera
// de este vocabulario (ver ALICUOTAS_IVA de arriba).
export const IMPUESTO_TIPOS = [
  { value: 'PERCEPCION_IVA', label: 'Percepción IVA' },
  { value: 'PERCEPCION_IIBB', label: 'Percepción IIBB' },
  { value: 'PERCEPCION_MUNICIPAL', label: 'Percepción Municipal' },
  { value: 'RETENCION_IVA', label: 'Retención IVA' },
  { value: 'RETENCION_GANANCIAS', label: 'Retención Ganancias' },
  { value: 'RETENCION_SUSS', label: 'Retención SUSS' },
  { value: 'IMPUESTOS_INTERNOS', label: 'Impuestos Internos' },
];
