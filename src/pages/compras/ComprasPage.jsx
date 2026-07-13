import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { DataGrid } from '../../components/grid/DataGrid';
import { ConfirmDialog, Field } from '../../components/ui';
import { EntityPicker } from '../../components/form/EntityPicker';
import { useList, useFetch, useMutation, useConfirm } from '../../hooks';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrencyARS } from '../../utils/format';
import { ESTADOS_COMPRA } from './constants';
import { getErrorMessage } from '../../utils/errorMessage';

const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const today = () => new Date().toISOString().slice(0, 10);

export const ComprasPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm, dialog, resolve } = useConfirm();

  const [form, setForm] = useState({ fecha_desde: startOfMonth(), fecha_hasta: today(), estado: 'TODOS', proveedor_id: null });

  const { items, loading, error, refetch, filter } = useList('/costos/compras', { ...form });
  const { data: resumen, refetch: refetchResumen } = useFetch('/costos/cuenta-corriente/resumen', {
    fecha_desde: form.fecha_desde, fecha_hasta: form.fecha_hasta,
  });

  const { mutate: remove } = useMutation((id) => api.delete(`/costos/compras/${id}`), {
    onSuccess: () => { toast.success('Compra eliminada correctamente'); refetch(); },
    onError: () => toast.error('Error al eliminar la compra'),
  });

  const applyFilters = () => {
    filter({ fecha_desde: form.fecha_desde, fecha_hasta: form.fecha_hasta, estado: form.estado, proveedor_id: form.proveedor_id });
    refetchResumen({ fecha_desde: form.fecha_desde, fecha_hasta: form.fecha_hasta });
  };

  const handleDelete = async (row) => {
    const ok = await confirm({
      title: 'Confirmar eliminación',
      message: '¿Está seguro que desea borrar esta compra?',
    });
    if (ok) remove(row.id);
  };

  const summary = Array.isArray(resumen) ? resumen[0] : resumen;

  const columns = [
    { accessorKey: 'fecha', header: 'Fecha' },
    { accessorKey: 'tipo_comprobante', header: 'Tipo de Comprobante' },
    { accessorKey: 'proveedor_nombre', header: 'Proveedor' },
    { accessorKey: 'numero', header: 'Número' },
    { accessorKey: 'estado', header: 'Estado' },
    { accessorKey: 'total', header: 'Total', cell: ({ getValue }) => formatCurrencyARS(getValue()) },
    { accessorKey: 'saldo_pendiente', header: 'Saldo Pendiente', cell: ({ getValue }) => formatCurrencyARS(getValue()) },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/compras/${row.original.id}/edit`)}>Editar</button>
          <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDelete(row.original)}>Eliminar</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Comprobante de Compras</div>
          <div className="page-subtitle">Cuenta corriente de proveedores</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/compras/create')}>
          <Plus size={14} /> Nuevo Comprobante
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
          <div className="form-group field-w-md">
            <label className="form-label">Estado</label>
            <select className="form-select" value={form.estado}
              onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
              {ESTADOS_COMPRA.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <Field label="Proveedor" size="md">
            <EntityPicker
              resource="/costos/proveedores"
              searchField="nombre"
              value={form.proveedor_id}
              onChange={v => setForm(f => ({ ...f, proveedor_id: v }))}
            />
          </Field>
          <div className="flex items-end">
            <button className="btn btn-primary" onClick={applyFilters}>Aplicar Filtros</button>
          </div>
        </div>
      </div>

      {summary && (
        <div className="grid-2" style={{ marginBottom: 16 }}>
          <div className="card"><div className="card-body">
            <div className="form-label">Total Facturas Pendientes</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrencyARS(summary.total_facturas_pendientes)}</div>
          </div></div>
          <div className="card"><div className="card-body">
            <div className="form-label">Total Gastos en el Periodo</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrencyARS(summary.total_gastos)}</div>
          </div></div>
        </div>
      )}

      <DataGrid
        columns={columns}
        data={items}
        loading={loading}
        title="Comprobante de Compras"
        emptyText={error ? getErrorMessage(error) : 'No hay compras para el período seleccionado'}
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
