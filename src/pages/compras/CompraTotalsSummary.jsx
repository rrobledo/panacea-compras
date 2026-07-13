import { formatCurrencyARS } from '../../utils/format';
import { computeCompraTotals } from './compraTotals';

export const CompraTotalsSummary = ({ detalle, impuestos, header }) => {
  const totals = computeCompraTotals(detalle, impuestos, header);
  const ivaEntries = Object.entries(totals.ivaPorAlicuota).filter(([, importe]) => importe !== 0);

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-body form-row">
        <div className="form-group field-w-sm">
          <div className="form-label">Neto Gravado</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{formatCurrencyARS(totals.subtotal)}</div>
        </div>
        <div className="form-group field-w-sm">
          <div className="form-label">IVA</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{formatCurrencyARS(totals.iva)}</div>
        </div>
        <div className="form-group field-w-sm">
          <div className="form-label">Percepciones</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{formatCurrencyARS(totals.percepciones)}</div>
        </div>
        <div className="form-group field-w-sm">
          <div className="form-label">Retenciones</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>-{formatCurrencyARS(totals.retenciones)}</div>
        </div>
        <div className="form-group field-w-sm">
          <div className="form-label">Otros Tributos</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{formatCurrencyARS(totals.impuestos)}</div>
        </div>
        <div className="form-group field-w-sm">
          <div className="form-label">Exento / No Gravado</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{formatCurrencyARS(totals.importeExento + totals.importeNoGravado)}</div>
        </div>
        <div className="form-group field-w-sm">
          <div className="form-label">Total</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrencyARS(totals.total)}</div>
        </div>
      </div>
      {ivaEntries.length > 0 && (
        <div className="card-body" style={{ paddingTop: 0 }}>
          <div className="form-label">IVA por alícuota</div>
          <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
            {ivaEntries.map(([alicuota, importe]) => (
              <span key={alicuota} className="pending-badge" style={{ marginLeft: 0 }}>
                {alicuota}%: {formatCurrencyARS(importe)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
