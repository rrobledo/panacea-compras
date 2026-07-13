import { useNavigate, useParams } from 'react-router-dom';
import { ItemGastoForm } from './ItemGastoForm';
import { PageLoader, ErrorState } from '../../components/ui';
import { useFetch, useMutation } from '../../hooks';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';

export const ItemGastoEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch(`/costos/items-gasto/${id}`);

  const { mutate, loading: saving } = useMutation((values) => api.put(`/costos/items-gasto/${id}`, values), {
    onSuccess: () => { toast.success('Ítem de gasto actualizado correctamente'); navigate('/items-gasto'); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error al guardar los cambios'),
  });

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Editar Ítem de Gasto</div>
        </div>
      </div>
      <ItemGastoForm initialData={data} onSubmit={mutate} onCancel={() => navigate('/items-gasto')} saving={saving} />
    </div>
  );
};
