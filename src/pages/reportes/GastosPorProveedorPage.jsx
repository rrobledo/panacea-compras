import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { DataGrid } from '../../components/grid/DataGrid';
import { ErrorState } from '../../components/ui';
import { useFetch } from '../../hooks';
import { formatCurrencyARS } from '../../utils/format';
import { getErrorMessage } from '../../utils/errorMessage';

const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const today = () => new Date().toISOString().slice(0, 10);

export const GastosPorProveedorPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fecha_desde: startOfMonth(), fecha_hasta: today() });

  const { data, loading, error, refetch } = useFetch('/costos/cuenta-corriente/gastos-por-proveedor', {
    fecha_desde: form.fecha_desde, fecha_hasta: form.fecha_hasta,
  });

  const applyFilters = () => refetch({ fecha_desde: form.fecha_desde, fecha_hasta: form.fecha_hasta });

  const proveedores = data?.proveedores || [];

  const verDetalle = (proveedorId) => navigate(
    `/reportes/gastos-por-proveedor/${proveedorId}?fecha_desde=${form.fecha_desde}&fecha_hasta=${form.fecha_hasta}`,
  );

  const columns = [
    { accessorKey: 'proveedor_nombre', header: 'Proveedor' },
    { accessorKey: 'total', header: 'Total Gastado', cell: ({ getValue }) => formatCurrencyARS(getValue()) },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <button className="btn btn-ghost btn-sm" onClick={() => verDetalle(row.original.proveedor_id)}>
          <Eye size={14} /> Ver Detalle
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Gastos por Proveedor</div>
          <div className="page-subtitle">Gastos del período agrupados por proveedor, de mayor a menor</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body form-row">
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
            <button className="btn btn-primary" onClick={applyFilters}>Aplicar Filtros</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="form-label">Total del Período</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrencyARS(data?.total_periodo)}</div>
        </div>
      </div>

      {error ? <ErrorState message={getErrorMessage(error)} onRetry={applyFilters} /> : (
        <DataGrid
          columns={columns}
          data={proveedores}
          loading={loading}
          title="Gastos por Proveedor"
          emptyText="No hay gastos para el período seleccionado"
        />
      )}
    </div>
  );
};
