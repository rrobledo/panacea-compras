import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompraForm } from './CompraForm';
import { CompraDetalleImpuestosTabs } from './CompraDetalleImpuestosTabs';
import { CompraTotalsSummary } from './CompraTotalsSummary';
import { PagoMediosEditor } from '../pagos/PagoMediosEditor';
import { FileUploadField } from '../../components/form/FileUploadField';
import { FormActions } from '../../components/ui';
import { useStagedList } from '../../hooks/useStagedList';
import { computeCompraTotals, roundCurrency } from './compraTotals';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const CompraCreatePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [adjuntos, setAdjuntos] = useState([]); // staged File objects
  const [formValues, setFormValues] = useState({
    tipo_comprobante: 'FACTURA_A', condicion_pago: 'CUENTA_CORRIENTE',
    descuento_general: '0', importe_exento: '0', importe_no_gravado: '0',
  });
  const [medios, setMedios] = useState([]);
  const detalle = useStagedList([], { idField: 'id' });
  const impuestos = useStagedList([], { idField: 'id' });

  const isDirty = detalle.isDirty || impuestos.isDirty || adjuntos.length > 0;
  const totals = computeCompraTotals(detalle.items, impuestos.items, formValues);
  const isContado = formValues.condicion_pago === 'CONTADO';
  const mediosTotal = roundCurrency(medios.reduce((sum, m) => sum + Number(m.importe), 0));

  const handleOrdenCompraSelect = (ordenCompra) => {
    for (const line of ordenCompra.detalle || []) {
      detalle.add({
        tipo: line.insumo_id != null ? 'INSUMO' : 'LIBRE',
        insumo_id: line.insumo_id,
        item_gasto_id: null,
        descripcion: line.descripcion || '',
        cantidad: line.cantidad_pedida,
        precio_unitario: line.precio_unitario_estimado || 0,
        porcentaje_descuento: 0,
        alicuota_iva: 21,
      });
    }
  };

  const handleSubmit = async (values) => {
    if (isContado && (medios.length === 0 || mediosTotal !== totals.total)) {
      toast.error('Cargue medios de pago cuyo total coincida con el Total del comprobante');
      return;
    }

    setSaving(true);
    let compraId;
    try {
      const res = await api.post('/costos/compras', {
        ...values,
        descuento_general: Number(values.descuento_general || 0),
        importe_exento: Number(values.importe_exento || 0),
        importe_no_gravado: Number(values.importe_no_gravado || 0),
        detalle: detalle.items.map(({ tipo, insumo_id, item_gasto_id, descripcion, cantidad, precio_unitario, porcentaje_descuento, alicuota_iva }) =>
          ({ tipo, insumo_id, item_gasto_id, descripcion, cantidad, precio_unitario, porcentaje_descuento, alicuota_iva })),
        impuestos: impuestos.items.map(({ tipo, importe }) => ({ tipo, importe })),
      });
      compraId = res.data.id;
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al crear la compra');
      setSaving(false);
      return;
    }

    if (isContado) {
      try {
        const pagoRes = await api.post('/costos/pagos', {
          proveedor_id: values.proveedor_id, fecha: values.fecha,
          observaciones: `Pago Contado — Comprobante ${values.numero}`,
          importe: mediosTotal, medios,
        });
        await api.post(`/costos/pagos/${pagoRes.data.id}/aplicaciones`, [{ compra_id: compraId, importe: totals.total }]);
      } catch (e) {
        toast.error(e.response?.data?.detail || 'La compra se creó, pero el pago no se pudo registrar. Completalo desde la edición de la compra.');
        navigate(`/compras/${compraId}/edit`);
        setSaving(false);
        return;
      }
    }

    const filesToUpload = adjuntos.filter(Boolean);
    if (filesToUpload.length > 0) {
      const results = await Promise.allSettled(filesToUpload.map(file => {
        const form = new FormData();
        form.append('file', file);
        return api.post(`/costos/compras/${compraId}/adjuntos`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      }));
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        toast.error(`La compra se creó, pero ${failed} adjunto(s) no se pudieron subir. Podés reintentar desde la edición.`);
        navigate(`/compras/${compraId}/edit`);
        setSaving(false);
        return;
      }
    }

    toast.success('Compra creada correctamente');
    navigate('/compras');
  };

  const handleCancel = () => {
    if (isDirty) {
      const discard = window.confirm('Hay renglones, impuestos o adjuntos cargados sin guardar. ¿Desea salir de todas formas?');
      if (!discard) return;
    }
    navigate('/compras');
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Nuevo Comprobante</div>
        </div>
      </div>
      <CompraForm onSubmit={handleSubmit} onOrdenCompraSelect={handleOrdenCompraSelect} onValuesChange={setFormValues} />
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

      {isContado && (
        <PagoMediosEditor medios={medios} onChange={setMedios} />
      )}
      {isContado && mediosTotal !== totals.total && (
        <div className="form-error" style={{ marginTop: 8 }}>
          El total de medios de pago ({mediosTotal}) debe coincidir con el Total del comprobante ({totals.total})
        </div>
      )}

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

      <FormActions formId="compra-form" onCancel={handleCancel} saving={saving} />
    </div>
  );
};
