import { useNavigate } from 'react-router-dom';
import { OrdenCompraForm } from './OrdenCompraForm';
import { OrdenCompraDetalleEditor } from './OrdenCompraDetalleEditor';
import { FormActions } from '../../components/ui';
import { useStagedList } from '../../hooks/useStagedList';
import { useMutation } from '../../hooks';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const OrdenCompraCreatePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const detalle = useStagedList([], { idField: 'id' });

  const { mutate, loading } = useMutation((values) => api.post('/costos/ordenes-compra', {
    ...values,
    detalle: detalle.items.map(({ insumo_id, descripcion, cantidad_pedida, precio_unitario_estimado, cantidad_recibida }) =>
      ({ insumo_id, descripcion, cantidad_pedida, precio_unitario_estimado, cantidad_recibida })),
  }), {
    onSuccess: () => { toast.success('Orden de compra creada correctamente'); navigate('/ordenes-compra'); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error al crear la orden de compra'),
  });

  const handleCancel = () => {
    if (detalle.isDirty) {
      const discard = window.confirm('Hay insumos cargados sin guardar. ¿Desea salir de todas formas?');
      if (!discard) return;
    }
    navigate('/ordenes-compra');
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Nueva Orden de Compra</div>
        </div>
      </div>
      <OrdenCompraForm onSubmit={mutate} />
      <OrdenCompraDetalleEditor items={detalle.items} onAdd={detalle.add} onRemove={detalle.remove} />
      <FormActions formId="orden-compra-form" onCancel={handleCancel} saving={loading} />
    </div>
  );
};
