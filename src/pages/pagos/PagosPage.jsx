import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Eye } from 'lucide-react';
import { DataGrid } from '../../components/grid/DataGrid';
import { ConfirmDialog, PageLoader, ErrorState } from '../../components/ui';
import { ComprobantesAplicadosModal } from './ComprobantesAplicadosModal';
import { PagoDetailModal } from './PagoDetailModal';
import { useList, useMutation, useConfirm } from '../../hooks';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrencyARS, formatDateTime } from '../../utils/format';
import { getErrorMessage } from '../../utils/errorMessage';

const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const today = () => new Date().toISOString().slice(0, 10);

export const PagosPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm, dialog, resolve } = useConfirm();
  const [form, setForm] = useState({ fecha_desde: startOfMonth(), fecha_hasta: today() });
  const { items, loading, error, refetch, filter } = useList('/costos/pagos', { ...form });
  const [comprobantesPago, setComprobantesPago] = useState(null);
  const [detallePagoId, setDetallePagoId] = useState(null);

  const applyFilters = () => filter({ fecha_desde: form.fecha_desde, fecha_hasta: form.fecha_hasta });

  const { mutate: remove } = useMutation((id) => api.delete(`/costos/pagos/${id}`), {
    onSuccess: () => { toast.success('Pago eliminado correctamente'); refetch(); },
    onError: () => toast.error('Error al eliminar el pago'),
  });

  const handleDelete = async (row) => {
    const ok = await confirm({
      title: 'Confirmar eliminación',
      message: 'Si el pago tiene aplicaciones a comprobantes, se van a revertir (el saldo pendiente de esos comprobantes vuelve a subir). ¿Está seguro que desea borrar este pago?',
    });
    if (ok) remove(row.id);
  };

  const columns = [
    { accessorKey: 'fecha', header: 'Fecha' },
    { accessorKey: 'proveedor_nombre', header: 'Proveedor' },
    { accessorKey: 'importe', header: 'Importe', cell: ({ getValue }) => formatCurrencyARS(getValue()) },
    { accessorKey: 'estado', header: 'Estado' },
    { accessorKey: 'created_at', header: 'Creado', cell: ({ getValue }) => formatDateTime(getValue()) },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setDetallePagoId(row.original.id)}>
            <Eye size={14} /> Ver Detalle
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setComprobantesPago(row.original)}>
            <FileText size={14} /> Comprobantes Aplicados
          </button>
          <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDelete(row.original)}>Eliminar</button>
        </div>
      ),
    },
  ];

  if (loading && items.length === 0) return <PageLoader />;
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Pagos en Cuenta Corriente</div>
          <div className="page-subtitle">Tesorería — pagos a proveedores</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/pagos/create')}>
          <Plus size={14} /> Nuevo Pago
        </button>
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

      <DataGrid columns={columns} data={items} loading={loading} title="Pagos" emptyText="No hay pagos para el período seleccionado" />

      <ComprobantesAplicadosModal
        open={!!comprobantesPago}
        onClose={() => setComprobantesPago(null)}
        pago={comprobantesPago}
      />

      <PagoDetailModal
        open={!!detallePagoId}
        onClose={() => setDetallePagoId(null)}
        pagoId={detallePagoId}
      />

      <ConfirmDialog
        open={!!dialog}
        title={dialog?.title}
        message={dialog?.message}
        onConfirm={() => resolve(true)}
        onCancel={() => resolve(false)}
      />
    </div>
  );
};
