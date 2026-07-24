import { useState } from 'react';
import { Wallet, Paperclip } from 'lucide-react';
import { Modal, EmptyState } from '../../components/ui';
import { FileUploadField } from '../../components/form/FileUploadField';
import { useFetch } from '../../hooks';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrencyARS } from '../../utils/format';
import { adjuntoUrl } from '../../utils/attachments';
import { TIPOS_MEDIO } from './constants';

/**
 * Read-only detail view of a Pago (`GET /costos/pagos/{id}`, which nests
 * `medios` and `adjuntos`), opened from the Pagos list. A Pago has no
 * dedicated edit page — the backend's `PagoUpdate` doesn't cover medios,
 * and there's no per-medio endpoint post-creation — so uploading further
 * adjuntos here (`POST /costos/pagos/{id}/adjuntos`) is the only "edit"
 * a Pago supports once created. Mirrors CompraDetailModal's Adjuntos
 * section/thumbnail preview.
 */
export const PagoDetailModal = ({ open, onClose, pagoId }) => {
  const { data: pago, loading, refetch } = useFetch(open && pagoId ? `/costos/pagos/${pagoId}` : null, {}, [pagoId]);
  const toast = useToast();
  const [newAdjunto, setNewAdjunto] = useState(null);
  const [uploading, setUploading] = useState(false);

  const medios = pago?.medios || [];
  const adjuntos = (pago?.adjuntos || []).map(a => ({ ...a, url: adjuntoUrl(`/costos/pagos/${pagoId}`, a.id) }));

  const handleAddAdjunto = async (file) => {
    if (!file) { setNewAdjunto(null); return; }
    setNewAdjunto(file);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      await api.post(`/costos/pagos/${pagoId}/adjuntos`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNewAdjunto(null);
      refetch();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al subir el adjunto');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle del Pago"
      size="lg"
      footer={<button className="btn btn-secondary" onClick={onClose}>Cerrar</button>}
    >
      {loading || !pago ? (
        <div style={{ padding: 24, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : (
        <>
          <div className="form-row">
            <div className="form-group field-w-sm">
              <div className="form-label">Proveedor</div>
              <div>{pago.proveedor_nombre}</div>
            </div>
            <div className="form-group field-w-sm">
              <div className="form-label">Fecha</div>
              <div>{pago.fecha}</div>
            </div>
            <div className="form-group field-w-sm">
              <div className="form-label">Estado</div>
              <div>{pago.estado}</div>
            </div>
            <div className="form-group field-w-sm">
              <div className="form-label">Importe</div>
              <div style={{ fontWeight: 600 }}>{formatCurrencyARS(pago.importe)}</div>
            </div>
          </div>

          {pago.observaciones && (
            <div className="form-group" style={{ marginTop: 8 }}>
              <div className="form-label">Observaciones</div>
              <div>{pago.observaciones}</div>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <div className="form-label" style={{ marginBottom: 8 }}>Medios de Pago</div>
            {medios.length === 0 ? (
              <EmptyState icon={Wallet} title="Sin medios de pago" description="Este pago no tiene medios de pago cargados." />
            ) : (
              <div className="table-container">
                <table>
                  <thead><tr><th>Tipo</th><th>Importe</th><th>Banco</th><th>Número</th><th>Fecha Acreditación</th></tr></thead>
                  <tbody>
                    {medios.map(m => (
                      <tr key={m.id}>
                        <td>{TIPOS_MEDIO.find(t => t.value === m.tipo)?.label || m.tipo}</td>
                        <td>{formatCurrencyARS(m.importe)}</td>
                        <td>{m.banco || '—'}</td>
                        <td>{m.numero || '—'}</td>
                        <td>{m.fecha_acreditacion || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ marginTop: 20 }}>
            <div className="form-label" style={{ marginBottom: 8 }}>Adjuntos</div>
            {adjuntos.length === 0 && (
              <EmptyState icon={Paperclip} title="Sin adjuntos" description="Este pago todavía no tiene archivos adjuntos." />
            )}
            {adjuntos.map(a => (
              <FileUploadField key={a.id} value={a} onChange={() => {}} />
            ))}
            <div style={uploading ? { pointerEvents: 'none', opacity: 0.6 } : undefined}>
              <FileUploadField
                value={newAdjunto}
                onChange={handleAddAdjunto}
                label={uploading ? 'Subiendo...' : 'Agregar Adjunto'}
              />
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};
