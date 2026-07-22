import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CompraForm } from './CompraForm';
import { CompraDetalleImpuestosTabs } from './CompraDetalleImpuestosTabs';
import { CompraTotalsSummary } from './CompraTotalsSummary';
import { PagosAplicadosPanel } from './PagosAplicadosPanel';
import { FileUploadField } from '../../components/form/FileUploadField';
import { PageLoader, ErrorState, FormActions, EmptyState } from '../../components/ui';
import { Paperclip } from 'lucide-react';
import { useFetch } from '../../hooks';
import { useStagedList } from '../../hooks/useStagedList';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';

export const CompraEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch(`/costos/compras/${id}`);
  const [saving, setSaving] = useState(false);
  const [newAdjuntos, setNewAdjuntos] = useState([]);
  const [formValues, setFormValues] = useState({
    tipo_comprobante: data?.tipo_comprobante || 'FACTURA_A',
    descuento_general: data?.descuento_general ?? '0',
    importe_exento: data?.importe_exento ?? '0',
    importe_no_gravado: data?.importe_no_gravado ?? '0',
  });

  const detalle = useStagedList(data?.detalle || [], { idField: 'id' });
  const impuestos = useStagedList(data?.impuestos || [], { idField: 'id' });

  const isDirty = detalle.isDirty || impuestos.isDirty || newAdjuntos.some(Boolean);

  const handleSubmit = async (values) => {
    setSaving(true);
    // orden_compra_id is create-only on the backend (not part of CompraUpdate) — omit it here.
    const {
      proveedor_id, tipo_comprobante, punto_venta, numero, fecha, fecha_vencimiento, condicion_pago, categoria,
      descuento_general, importe_exento, importe_no_gravado, observaciones,
    } = values;
    const payload = {
      proveedor_id, tipo_comprobante, punto_venta, numero, fecha, fecha_vencimiento, condicion_pago, categoria,
      descuento_general: Number(descuento_general || 0),
      importe_exento: Number(importe_exento || 0),
      importe_no_gravado: Number(importe_no_gravado || 0),
      observaciones,
    };
    try {
      await api.put(`/costos/compras/${id}`, payload);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al guardar los cambios');
      setSaving(false);
      return;
    }

    const filesToUpload = newAdjuntos.filter(Boolean);
    const results = await Promise.allSettled([
      detalle.commit({
        create: (row) => api.post(`/costos/compras/${id}/detalle`, row),
        update: () => Promise.reject(new Error('Editar un renglón existente no está soportado')),
        remove: () => Promise.reject(new Error('Quitar un renglón existente no está soportado')),
      }),
      impuestos.commit({
        create: (row) => api.post(`/costos/compras/${id}/impuestos`, row),
        update: () => Promise.reject(new Error('Editar un impuesto existente no está soportado')),
        remove: () => Promise.reject(new Error('Quitar un impuesto existente no está soportado')),
      }),
      ...filesToUpload.map(file => {
        const form = new FormData();
        form.append('file', file);
        return api.post(`/costos/compras/${id}/adjuntos`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      }),
    ]);
    if (filesToUpload.length > 0 && results.slice(2).every(r => r.status === 'fulfilled')) {
      setNewAdjuntos([]);
    }

    const failedSections = results
      .map((r, i) => ({ r, name: i === 0 ? 'Detalle' : i === 1 ? 'Impuestos' : 'Adjuntos' }))
      .filter(({ r }) => r.status === 'rejected');

    setSaving(false);
    if (failedSections.length > 0) {
      toast.error(`La compra se guardó, pero ${[...new Set(failedSections.map(f => f.name))].join(' y ')} tuvo cambios que no se pudieron guardar. Volvé a intentar.`);
      refetch();
      return;
    }
    toast.success('Compra actualizada correctamente');
    navigate('/compras');
  };

  const handleCancel = () => {
    if (isDirty) {
      const discard = window.confirm('Hay cambios sin guardar en Detalle, Impuestos o Adjuntos. ¿Desea salir de todas formas?');
      if (!discard) return;
    }
    navigate('/compras');
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;

  const existingAdjuntos = data?.adjuntos || [];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Editar Comprobante</div>
        </div>
      </div>
      <CompraForm initialData={data} onSubmit={handleSubmit} onValuesChange={setFormValues} />
      <CompraDetalleImpuestosTabs
        detalle={detalle.items}
        impuestos={impuestos.items}
        onAddDetalle={detalle.add}
        onEditDetalle={detalle.editCreate}
        onRemoveDetalle={detalle.remove}
        onAddImpuesto={impuestos.add}
        onRemoveImpuesto={impuestos.remove}
        allowNegativeImpuestos={formValues.tipo_comprobante === 'NOTA_CREDITO'}
      />
      <CompraTotalsSummary detalle={detalle.items} impuestos={impuestos.items} header={formValues} />

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><h3 className="card-title">Adjuntos</h3></div>
        <div className="card-body">
          {existingAdjuntos.length === 0 && newAdjuntos.length === 0 && (
            <EmptyState icon={Paperclip} title="Sin adjuntos" description="Esta compra todavía no tiene archivos adjuntos." />
          )}
          {existingAdjuntos.map(a => (
            <FileUploadField key={a.id} value={a} onChange={() => {}} />
          ))}
          {newAdjuntos.map((file, i) => (
            <FileUploadField
              key={`new-${i}`}
              value={file}
              onChange={(v) => setNewAdjuntos(prev => v ? prev.map((f, j) => j === i ? v : f) : prev.filter((_, j) => j !== i))}
            />
          ))}
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setNewAdjuntos(prev => [...prev, null])} style={{ marginTop: 8 }}>
            Agregar Adjunto
          </button>
        </div>
      </div>

      <PagosAplicadosPanel compraId={id} compra={data} />

      <FormActions formId="compra-form" onCancel={handleCancel} saving={saving} />
    </div>
  );
};
