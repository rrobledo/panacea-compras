import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { DataGrid } from '../../components/grid/DataGrid';
import { PageLoader, ErrorState, ConfirmDialog, StatusBadge } from '../../components/ui';
import { useList, useMutation, useConfirm } from '../../hooks';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';

export const ItemsGastoPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { items, loading, error, refetch } = useList('/costos/items-gasto');
  const { confirm, dialog, resolve } = useConfirm();

  const { mutate: remove } = useMutation((id) => api.delete(`/costos/items-gasto/${id}`), {
    onSuccess: () => { toast.success('Ítem de gasto eliminado correctamente'); refetch(); },
    onError: () => toast.error('Error al eliminar el ítem de gasto'),
  });

  const handleDelete = async (row) => {
    const ok = await confirm({
      title: 'Confirmar eliminación',
      message: `¿Está seguro que desea borrar el ítem de gasto "${row.nombre}"?`,
    });
    if (ok) remove(row.id);
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;

  const columns = [
    { accessorKey: 'codigo', header: 'Código' },
    { accessorKey: 'nombre', header: 'Nombre' },
    { accessorKey: 'activo', header: 'Activo', cell: ({ getValue }) => <StatusBadge status={getValue() ? 'active' : 'inactive'} /> },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/items-gasto/${row.original.id}/edit`)}>Editar</button>
          <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDelete(row.original)}>Eliminar</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Ítems de Gasto</div>
          <div className="page-subtitle">Catálogo de conceptos de gasto reutilizables</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/items-gasto/create')}>
          <Plus size={14} /> Nuevo Ítem de Gasto
        </button>
      </div>

      <DataGrid columns={columns} data={items} loading={loading} title="Ítems de Gasto" emptyText="No hay ítems de gasto registrados" />

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
