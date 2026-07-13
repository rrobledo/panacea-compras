import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PagoForm } from './PagoForm';
import { FormActions } from '../../components/ui';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const PagoCreatePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (values, aplicaciones) => {
    setSaving(true);
    let pagoId;
    try {
      const res = await api.post('/costos/pagos', values);
      pagoId = res.data.id;
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al crear el pago');
      setSaving(false);
      return;
    }

    if (aplicaciones.length > 0) {
      try {
        await api.post(`/costos/pagos/${pagoId}/aplicaciones`, aplicaciones);
      } catch (e) {
        toast.error(e.response?.data?.detail || 'El pago se creó, pero no se pudo aplicar a los comprobantes. Podés aplicarlo desde "Aplicar a Compra".');
        navigate('/pagos');
        setSaving(false);
        return;
      }
    }

    toast.success('Pago creado correctamente');
    navigate('/pagos');
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Nuevo Pago en Cuenta Corriente</div>
        </div>
      </div>
      <PagoForm onSubmit={handleSubmit} />
      <FormActions formId="pago-form" onCancel={() => navigate('/pagos')} saving={saving} />
    </div>
  );
};
