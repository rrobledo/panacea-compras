import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer } from 'lucide-react';
import { PageLoader, ErrorState } from '../../components/ui';
import { useFetch } from '../../hooks';
import { formatCurrencyARS } from '../../utils/format';
import { ANIOS, MESES } from './constants';
import { getErrorMessage } from '../../utils/errorMessage';

const now = new Date();

export const LibroIvaPage = () => {
  const [filters, setFilters] = useState({ anio: now.getFullYear(), mes: now.getMonth() + 1 });
  const periodo = `${filters.anio}-${String(filters.mes).padStart(2, '0')}`;
  const { data, loading, error, refetch } = useFetch('/costos/libro-iva-compras', { periodo });
  const contentRef = useRef(null);
  const print = useReactToPrint({ contentRef });

  const applyFilters = () => refetch({ periodo: `${filters.anio}-${String(filters.mes).padStart(2, '0')}` });

  const rows = data || [];
  const money = (v) => formatCurrencyARS(v);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Libro IVA Compras</div>
          <div className="page-subtitle">Discriminación de IVA y percepciones por período</div>
        </div>
        <button className="btn btn-secondary btn-sm no-print" onClick={print}><Printer size={14} /> Imprimir</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body form-row">
          <div className="form-group field-w-xs">
            <label className="form-label">Año</label>
            <select className="form-select" value={filters.anio} onChange={e => setFilters(f => ({ ...f, anio: Number(e.target.value) }))}>
              {ANIOS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="form-group field-w-md">
            <label className="form-label">Mes</label>
            <select className="form-select" value={filters.mes} onChange={e => setFilters(f => ({ ...f, mes: Number(e.target.value) }))}>
              {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn btn-primary" onClick={applyFilters}>Aplicar Filtros</button>
          </div>
        </div>
      </div>

      {loading ? <PageLoader /> : error ? <ErrorState message={getErrorMessage(error)} onRetry={applyFilters} /> : (
        <div className="card" ref={contentRef}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Comprobante</th><th>Neto</th><th>IVA 21%</th><th>IVA 10.5%</th><th>IVA 27%</th>
                  <th>Exento</th><th>No Gravado</th><th>Perc. IVA</th><th>Perc. IIBB</th><th>Sin Discriminar</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: 24, color: 'var(--gray-400)' }}>
                    No hay compras para el período seleccionado
                  </td></tr>
                ) : rows.map((r, i) => (
                  <tr key={r.compra_id ?? i}>
                    <td>{r.numero ?? r.compra_id}</td>
                    <td>{money(r.neto)}</td>
                    <td>{money(r.iva_21)}</td>
                    <td>{money(r.iva_10_5)}</td>
                    <td>{money(r.iva_27)}</td>
                    <td>{money(r.exento)}</td>
                    <td>{money(r.no_gravado)}</td>
                    <td>{money(r.percepcion_iva)}</td>
                    <td>{money(r.percepcion_iibb)}</td>
                    <td>{money(r.sin_discriminar)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
