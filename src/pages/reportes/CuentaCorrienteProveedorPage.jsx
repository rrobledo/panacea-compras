import { useState } from 'react';
import { Field, PageLoader, ErrorState } from '../../components/ui';
import { EntityPicker } from '../../components/form/EntityPicker';
import { useFetch } from '../../hooks';
import { formatCurrencyARS } from '../../utils/format';
import { getErrorMessage } from '../../utils/errorMessage';

const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const today = () => new Date().toISOString().slice(0, 10);

export const CuentaCorrienteProveedorPage = () => {
  const [proveedorId, setProveedorId] = useState(null);
  const [form, setForm] = useState({ fecha_desde: startOfMonth(), fecha_hasta: today() });
  const [appliedFilters, setAppliedFilters] = useState({ proveedor_id: null, fecha_desde: startOfMonth(), fecha_hasta: today() });

  const { data: saldos } = useFetch('/costos/cuenta-corriente/saldos');
  const { data: ledger, loading, error, refetch } = useFetch(
    appliedFilters.proveedor_id ? `/costos/proveedores/${appliedFilters.proveedor_id}/cuenta-corriente` : null,
    { fecha_desde: appliedFilters.fecha_desde, fecha_hasta: appliedFilters.fecha_hasta },
    [appliedFilters.proveedor_id],
  );

  const applyFilters = () => setAppliedFilters({ proveedor_id: proveedorId, fecha_desde: form.fecha_desde, fecha_hasta: form.fecha_hasta });

  const movimientos = ledger?.movimientos || [];
  const cantidadCompras = movimientos.filter(m => m.tipo === 'FACTURA').length;
  const cantidadPagos = movimientos.filter(m => m.tipo === 'PAGO').length;
  const saldoActual = (saldos?.proveedores || []).find(p => p.proveedor_id === appliedFilters.proveedor_id)?.saldo || 0;
  const tieneSaldo = saldoActual > 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Cuenta Corriente de Proveedor</div>
          <div className="page-subtitle">Movimientos y estado de cuenta por período</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body form-row">
          <Field label="Proveedor" required size="md">
            <EntityPicker resource="/costos/proveedores" searchField="nombre" value={proveedorId} onChange={setProveedorId} />
          </Field>
          <div className="form-group field-w-sm">
            <label className="form-label">Fecha Desde</label>
            <input type="date" className="form-input" value={form.fecha_desde}
              onChange={e => setForm(f => ({ ...f, fecha_desde: e.target.value }))} />
          </div>
          <div className="form-group field-w-sm">
            <label className="form-label">Fecha Hasta</label>
            <input type="date" className="form-input" value={form.fecha_hasta}
              onChange={e => setForm(f => ({ ...f, fecha_hasta: e.target.value }))} />
          </div>
          <div className="flex items-end">
            <button className="btn btn-primary" onClick={applyFilters} disabled={!proveedorId}>Aplicar Filtros</button>
          </div>
        </div>
      </div>

      {!appliedFilters.proveedor_id ? (
        <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 24, color: 'var(--gray-400)' }}>
          Seleccione un proveedor y aplique los filtros para ver su cuenta corriente
        </div></div>
      ) : loading ? <PageLoader /> : error ? <ErrorState message={getErrorMessage(error)} onRetry={refetch} /> : (
        <>
          <div className="grid-3" style={{ marginBottom: 16 }}>
            <div className="card"><div className="card-body">
              <div className="form-label">Estado Actual</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: tieneSaldo ? 'var(--danger)' : 'var(--success)' }}>
                {tieneSaldo ? `Con Saldo Pendiente — ${formatCurrencyARS(saldoActual)}` : 'Sin Saldo Pendiente'}
              </div>
            </div></div>
            <div className="card"><div className="card-body">
              <div className="form-label">Compras en el Período</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{cantidadCompras}</div>
            </div></div>
            <div className="card"><div className="card-body">
              <div className="form-label">Pagos en el Período</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{cantidadPagos}</div>
            </div></div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="card-title">Movimientos</h3></div>
            <div className="table-container">
              <table>
                <thead><tr><th>Fecha</th><th>Tipo</th><th>Documento</th><th>Debe</th><th>Haber</th><th>Saldo</th></tr></thead>
                <tbody>
                  {movimientos.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--gray-400)' }}>
                      No hay movimientos para el período seleccionado
                    </td></tr>
                  ) : movimientos.map((m, i) => (
                    <tr key={i}>
                      <td>{m.fecha}</td>
                      <td>{m.tipo}</td>
                      <td>{m.documento}</td>
                      <td>{formatCurrencyARS(m.debe)}</td>
                      <td>{formatCurrencyARS(m.haber)}</td>
                      <td>{formatCurrencyARS(m.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
