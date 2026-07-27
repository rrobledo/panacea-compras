export const TIPOS_MEDIO = [
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'ECHEQ', label: 'Echeq' },
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TARJETA', label: 'Tarjeta' },
  // Temporal: hasta que exista soporte de Notas de Crédito en Comprobantes,
  // se registran como un medio de pago más (sin campos extra).
  { value: 'NOTA_CREDITO', label: 'Nota de Crédito' },
];

export const REQUIRES_BANKING_FIELDS = new Set(['CHEQUE', 'ECHEQ']);
