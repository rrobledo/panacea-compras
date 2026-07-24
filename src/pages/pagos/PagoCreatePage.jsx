import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PagoForm } from './PagoForm';
import { FileUploadField } from '../../components/form/FileUploadField';
import { FormActions } from '../../components/ui';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const PagoCreatePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [adjuntos, setAdjuntos] = useState([]); // staged File objects

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

    const filesToUpload = adjuntos.filter(Boolean);
    if (filesToUpload.length > 0) {
      const results = await Promise.allSettled(filesToUpload.map(file => {
        const form = new FormData();
        form.append('file', file);
        return api.post(`/costos/pagos/${pagoId}/adjuntos`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      }));
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        toast.error(`El pago se creó, pero ${failed} adjunto(s) no se pudieron subir. Podés reintentar desde "Ver Detalle".`);
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

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><h3 className="card-title">Adjuntos</h3></div>
        <div className="card-body">
          {adjuntos.map((file, i) => (
            <FileUploadField
              key={i}
              value={file}
              onChange={(v) => setAdjuntos(prev => v ? prev.map((f, j) => j === i ? v : f) : prev.filter((_, j) => j !== i))}
            />
          ))}
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAdjuntos(prev => [...prev, null])} style={{ marginTop: 8 }}>
            Agregar Adjunto
          </button>
        </div>
      </div>

      <FormActions formId="pago-form" onCancel={() => navigate('/pagos')} saving={saving} />
    </div>
  );
};
