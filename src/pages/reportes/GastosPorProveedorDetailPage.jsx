import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { DataGrid } from '../../components/grid/DataGrid';
import { PageLoader, ErrorState } from '../../components/ui';
import { CompraDetailModal } from '../compras/CompraDetailModal';
import { CATEGORIAS_COMPRA } from '../compras/constants';
import { useFetch, useList } from '../../hooks';
import { formatCurrencyARS } from '../../utils/format';
import { getErrorMessage } from '../../utils/errorMessage';

const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const today = () => new Date().toISOString().slice(0, 10);

export const GastosPorProveedorDetailPage = () => {
  const { proveedorId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    fecha_desde: searchParams.get('fecha_desde') || startOfMonth(),
    fecha_hasta: searchParams.get('fecha_hasta') || today(),
  });
  const [detailCompraId, setDetailCompraId] = useState(null);

  const { data: proveedor, loading: loadingProveedor, error: errorProveedor } = useFetch(`/costos/proveedores/${proveedorId}`);
  const { items, loading, error, refetch, filter } = useList('/costos/compras', {
    proveedor_id: proveedorId, fecha_desde: form.fecha_desde, fecha_hasta: form.fecha_hasta,
  });

  const applyFilters = () => filter({
    proveedor_id: proveedorId, fecha_desde: form.fecha_desde, fecha_hasta: form.fecha_hasta,
  });

  if (loadingProveedor) return <PageLoader />;
  if (errorProveedor) return <ErrorState message={getErrorMessage(errorProveedor)} />;

  const totalPeriodo = items.reduce((sum, c) => sum + Number(c.total || 0), 0);

  const columns = [
    { accessorKey: 'fecha', header: 'Fecha' },
    { accessorKey: 'tipo_comprobante', header: 'Tipo de Comprobante' },
    { accessorKey: 'numero', header: 'Número' },
    {
      accessorKey: 'categoria', header: 'Categoría',
      cell: ({ getValue }) => CATEGORIAS_COMPRA.find(c => c.value === getValue())?.label || getValue(),
    },
    { accessorKey: 'total', header: 'Total', cell: ({ getValue }) => formatCurrencyARS(getValue()) },
    { accessorKey: 'saldo_pendiente', header: 'Saldo Pendiente', cell: ({ getValue }) => formatCurrencyARS(getValue()) },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <button className="btn btn-ghost btn-sm" onClick={() => setDetailCompraId(row.original.id)}>
          <Eye size={14} /> Ver Detalle
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">{proveedor?.nombre}</div>
          <div className="page-subtitle">Gastos del período</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/reportes/gastos-por-proveedor')}>Volver</button>
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
          <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrencyARS(totalPeriodo)}</div>
        </div>
      </div>

      {error ? <ErrorState message={getErrorMessage(error)} onRetry={refetch} /> : (
        <DataGrid
          columns={columns}
          data={items}
          loading={loading}
          title="Gastos del Período"
          emptyText="Este proveedor no tiene gastos para el período seleccionado"
        />
      )}

      <CompraDetailModal
        open={!!detailCompraId}
        onClose={() => setDetailCompraId(null)}
        compraId={detailCompraId}
      />
    </div>
  );
};
