import { recentYears } from '../../utils/years';

export const ANIOS = recentYears();

export const MESES = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];

export const MESES_CON_TODOS = [{ value: 0, label: 'Todos' }, ...MESES];

export const SEMANAS = [0, 1, 2, 3, 4, 5, 6].map(n => ({ value: n, label: n === 0 ? 'Todas' : `Semana ${n}` }));

export const CLIENTES_VENTAS = [
  { value: 'Todos', label: 'Todos' },
  { value: 'TOTAL', label: 'TOTAL' },
  { value: 'SUBTOTAL', label: 'SUBTOTAL' },
  { value: 'Panacea Carlos Paz', label: 'Panacea Carlos Paz (TOTAL)' },
  { value: ' Panacea Carlos Paz', label: 'Panacea Carlos Paz (SUBTOTAL)' },
  { value: 'Panacea Villa Allende', label: 'Panacea Villa Allende (TOTAL)' },
  { value: ' Panacea Villa Allende', label: 'Panacea Villa Allende (SUBTOTAL)' },
  { value: 'Panacea Cordoba', label: 'Panacea Cordoba (TOTAL)' },
  { value: ' Panacea Cordoba', label: 'Panacea Cordoba (SUBTOTAL)' },
  { value: 'Dieteticas', label: 'Dieteticas (TOTAL)' },
  { value: ' Dieteticas', label: 'Dieteticas (SUBTOTAL)' },
];
