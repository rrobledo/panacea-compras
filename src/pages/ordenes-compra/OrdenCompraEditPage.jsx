import { useNavigate, useParams } from 'react-router-dom';
import { OrdenCompraForm } from './OrdenCompraForm';
import { OrdenCompraDetalleEditor } from './OrdenCompraDetalleEditor';
import { PageLoader, ErrorState, FormActions } from '../../components/ui';
import { useStagedList } from '../../hooks/useStagedList';
import { useFetch, useMutation } from '../../hooks';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';

export const OrdenCompraEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch(`/costos/ordenes-compra/${id}`);
  const detalle = useStagedList(data?.detalle || [], { idField: 'id' });

  const { mutate, loading: saving } = useMutation((values) => api.put(`/costos/ordenes-compra/${id}`, {
    ...values,
    detalle: detalle.items.map(({ insumo_id, descripcion, cantidad_pedida, precio_unitario_estimado, cantidad_recibida }) =>
      ({ insumo_id, descripcion, cantidad_pedida, precio_unitario_estimado, cantidad_recibida })),
  }), {
    onSuccess: () => { toast.success('Orden de compra actualizada correctamente'); navigate('/ordenes-compra'); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error al guardar los cambios'),
  });

  const handleCancel = () => {
    if (detalle.isDirty) {
      const discard = window.confirm('Hay insumos cargados sin guardar. ¿Desea salir de todas formas?');
      if (!discard) return;
    }
    navigate('/ordenes-compra');
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Editar Orden de Compra</div>
        </div>
      </div>
      <OrdenCompraForm initialData={data} onSubmit={mutate} />
      <OrdenCompraDetalleEditor items={detalle.items} onAdd={detalle.add} onRemove={detalle.remove} />
      <FormActions formId="orden-compra-form" onCancel={handleCancel} saving={saving} />
    </div>
  );
};
