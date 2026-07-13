import { useNavigate } from 'react-router-dom';
import { ItemGastoForm } from './ItemGastoForm';
import { useMutation } from '../../hooks';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const ItemGastoCreatePage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const { mutate, loading } = useMutation((data) => api.post('/costos/items-gasto', data), {
    onSuccess: () => { toast.success('Ítem de gasto creado correctamente'); navigate('/items-gasto'); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error al crear el ítem de gasto'),
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Nuevo Ítem de Gasto</div>
        </div>
      </div>
      <ItemGastoForm onSubmit={mutate} onCancel={() => navigate('/items-gasto')} saving={loading} />
    </div>
  );
};
