import { useState } from 'react';
import { Modal, Field } from '../../components/ui';
import { EntityPicker } from '../../components/form/EntityPicker';
import { useFetch } from '../../hooks';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { formatCurrencyARS } from '../../utils/format';

/**
 * Applies an existing pago against a compra
 * (`POST /costos/pagos/{id}/aplicaciones`), per the `tesoreria-pagos` spec
 * and design.md D4. Entry point: a Compra's edit page, via its Pagos
 * Aplicados panel — `preselectedCompra` is given, user picks which
 * existing pago (of this proveedor) to apply.
 */
export const AplicarPagoModal = ({ open, onClose, proveedorId, preselectedCompra, onApplied }) => {
  const toast = useToast();
  const [selectedPago, setSelectedPago] = useState(null);
  const [importe, setImporte] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: aplicaciones } = useFetch(
    selectedPago ? `/costos/pagos/${selectedPago.id}/aplicaciones` : null,
  );
  const yaAplicado = (aplicaciones || []).reduce((sum, a) => sum + Number(a.importe), 0);
  const importePago = selectedPago?.importe;
  const restante = importePago != null ? importePago - yaAplicado : null;

  const canSubmit = selectedPago != null && importe !== ''
    && (restante == null || Number(importe) <= restante);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/costos/pagos/${selectedPago.id}/aplicaciones`, [
        { compra_id: preselectedCompra.id, importe: Number(importe) },
      ]);
      toast.success('Pago aplicado correctamente');
      setImporte('');
      onApplied?.();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al aplicar el pago');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Aplicar Pago"
      footer={<>
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={!canSubmit || submitting}>
          {submitting ? 'Aplicando…' : 'Aplicar'}
        </button>
      </>}
    >
      <div className="form-row">
        <Field label="Pago" span={2}>
          <EntityPicker
            resource="/costos/pagos"
            searchField="fecha"
            value={selectedPago?.id}
            onChange={id => { if (id == null) setSelectedPago(null); }}
            onSelectRow={setSelectedPago}
            extraParams={proveedorId ? { proveedor_id: proveedorId } : {}}
          />
        </Field>
        <Field label="Importe a Aplicar" required size="sm"
          hint={restante != null ? `Restante del pago: ${formatCurrencyARS(restante)}` : undefined}>
          <input type="number" step="0.01" className="form-input" value={importe} onChange={e => setImporte(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
};
