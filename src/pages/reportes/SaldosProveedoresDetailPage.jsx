import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { DataGrid } from '../../components/grid/DataGrid';
import { PageLoader, ErrorState } from '../../components/ui';
import { CompraDetailModal } from '../compras/CompraDetailModal';
import { useFetch, useList } from '../../hooks';
import { formatCurrencyARS } from '../../utils/format';
import { getErrorMessage } from '../../utils/errorMessage';

export const SaldosProveedoresDetailPage = () => {
  const { proveedorId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fecha_desde: '', fecha_hasta: '' });
  const [detailCompraId, setDetailCompraId] = useState(null);

  const { data: proveedor, loading: loadingProveedor, error: errorProveedor } = useFetch(`/costos/proveedores/${proveedorId}`);
  const { items, loading, error, refetch, filter } = useList('/costos/compras', {
    proveedor_id: proveedorId, con_saldo: true,
  });

  const applyFilters = () => filter({
    proveedor_id: proveedorId, con_saldo: true,
    fecha_desde: form.fecha_desde || undefined, fecha_hasta: form.fecha_hasta || undefined,
  });

  if (loadingProveedor) return <PageLoader />;
  if (errorProveedor) return <ErrorState message={getErrorMessage(errorProveedor)} />;

  const columns = [
    { accessorKey: 'fecha', header: 'Fecha' },
    { accessorKey: 'tipo_comprobante', header: 'Tipo de Comprobante' },
    { accessorKey: 'numero', header: 'Número' },
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
          <div className="page-subtitle">Comprobantes con saldo pendiente</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/reportes/saldos-proveedores')}>Volver</button>
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

      {error ? <ErrorState message={getErrorMessage(error)} onRetry={refetch} /> : (
        <DataGrid
          columns={columns}
          data={items}
          loading={loading}
          title="Comprobantes con Saldo"
          emptyText="Este proveedor no tiene comprobantes con saldo pendiente para el filtro seleccionado"
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
