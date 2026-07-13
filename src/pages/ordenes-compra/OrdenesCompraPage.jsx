import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { DataGrid } from '../../components/grid/DataGrid';
import { PageLoader, ErrorState, StatusBadge, Field } from '../../components/ui';
import { EntityPicker } from '../../components/form/EntityPicker';
import { useList } from '../../hooks';
import { getErrorMessage } from '../../utils/errorMessage';
import { ESTADOS_ORDEN_COMPRA } from './constants';

const ESTADO_STATUS_MAP = { PENDIENTE: 'pending', PARCIAL: 'pending', RECIBIDA: 'completed', CERRADA: 'gray', CANCELADA: 'cancelled' };
const ESTADOS_FILTRO = [{ value: 'TODOS', label: 'Todos' }, ...ESTADOS_ORDEN_COMPRA];

export const OrdenesCompraPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ estado: 'PENDIENTE', proveedor_id: null });
  const { items, loading, error, refetch, filter } = useList('/costos/ordenes-compra', { estado: 'PENDIENTE' });

  const applyFilters = () => filter({ estado: form.estado, proveedor_id: form.proveedor_id });

  // El backend puede no filtrar por `estado` en este endpoint; se aplica
  // también client-side como red de seguridad (design.md D2).
  const visibleItems = form.estado === 'TODOS' ? items : items.filter(i => i.estado === form.estado);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;

  const columns = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'proveedor_nombre', header: 'Proveedor' },
    { accessorKey: 'fecha', header: 'Fecha' },
    { accessorKey: 'fecha_entrega_estimada', header: 'Entrega Estimada' },
    { accessorKey: 'estado', header: 'Estado', cell: ({ getValue }) => <StatusBadge status={ESTADO_STATUS_MAP[getValue()] || getValue()} /> },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/ordenes-compra/${row.original.id}/edit`)}>Editar</button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Órdenes de Compra</div>
          <div className="page-subtitle">Seguimiento de pedidos a proveedores</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/ordenes-compra/create')}>
          <Plus size={14} /> Nueva Orden de Compra
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body form-row">
          <Field label="Estado" size="md">
            <select className="form-select" value={form.estado}
              onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
              {ESTADOS_FILTRO.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
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

      <DataGrid columns={columns} data={visibleItems} loading={loading} title="Órdenes de Compra" emptyText="No hay órdenes de compra para el filtro seleccionado" />
    </div>
  );
};
