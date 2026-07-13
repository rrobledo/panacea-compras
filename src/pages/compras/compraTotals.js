/**
 * Client-side preview only — mirrors what the backend computes from
 * `detalle`/`impuestos`/header fields on save (design.md D6); never sent
 * as client-authored totals.
 */

// Redondeo comercial (half-up), no bancario, para evitar diferencias de
// centavos contra el backend.
export const roundCurrency = (n) => {
  const sign = n < 0 ? -1 : 1;
  return sign * Math.round((Math.abs(n) + Number.EPSILON) * 100) / 100;
};

const lineNeto = (r) => {
  const subtotalBruto = Number(r.cantidad) * Number(r.precio_unitario);
  const descuento = subtotalBruto * (Number(r.porcentaje_descuento || 0) / 100);
  return subtotalBruto - descuento;
};

export const computeCompraTotals = (detalle, impuestos, header = {}) => {
  const descuentoGeneralPct = Number(header.descuento_general || 0);
  const importeExento = Number(header.importe_exento || 0);
  const importeNoGravado = Number(header.importe_no_gravado || 0);
  const factor = 1 - descuentoGeneralPct / 100;

  let netoGravado = 0;
  let iva = 0;
  const ivaPorAlicuota = {};

  for (const r of detalle) {
    const baseLinea = lineNeto(r) * factor;
    const alicuota = Number(r.alicuota_iva || 0);
    const ivaLinea = baseLinea * (alicuota / 100);
    netoGravado += baseLinea;
    iva += ivaLinea;
    ivaPorAlicuota[alicuota] = (ivaPorAlicuota[alicuota] || 0) + ivaLinea;
  }

  const percepciones = impuestos.filter(r => r.tipo.startsWith('PERCEPCION_')).reduce((sum, r) => sum + Number(r.importe), 0);
  const retenciones = impuestos.filter(r => r.tipo.startsWith('RETENCION_')).reduce((sum, r) => sum + Number(r.importe), 0);
  const otrosTributos = impuestos
    .filter(r => !r.tipo.startsWith('PERCEPCION_') && !r.tipo.startsWith('RETENCION_'))
    .reduce((sum, r) => sum + Number(r.importe), 0);

  const total = netoGravado + iva + percepciones + otrosTributos + importeExento + importeNoGravado - retenciones;

  return {
    subtotal: roundCurrency(netoGravado),
    iva: roundCurrency(iva),
    ivaPorAlicuota: Object.fromEntries(
      Object.entries(ivaPorAlicuota).map(([alicuota, importe]) => [alicuota, roundCurrency(importe)]),
    ),
    percepciones: roundCurrency(percepciones),
    retenciones: roundCurrency(retenciones),
    impuestos: roundCurrency(otrosTributos),
    importeExento: roundCurrency(importeExento),
    importeNoGravado: roundCurrency(importeNoGravado),
    total: roundCurrency(total),
  };
};
