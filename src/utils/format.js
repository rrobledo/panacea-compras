export const formatCurrencyARS = (value) => {
  const n = Number(value ?? 0);
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
};

export const formatPercent = (value) => {
  const n = Number(value ?? 0);
  return `${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`;
};

export const formatDateTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
};
