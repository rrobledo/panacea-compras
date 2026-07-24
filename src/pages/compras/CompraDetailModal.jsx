import { Package, Wallet, Paperclip, ExternalLink } from 'lucide-react';
import { Modal, EmptyState } from '../../components/ui';
import { useFetch } from '../../hooks';
import { formatCurrencyARS } from '../../utils/format';
import { isImageName, adjuntoUrl } from '../../utils/attachments';
import { TIPOS_COMPROBANTE, CONDICIONES_PAGO, CATEGORIAS_COMPRA, DETALLE_TIPOS, IMPUESTO_TIPOS } from './constants';

const isImageAdjunto = (a) => isImageName(a.nombre || a.url);

/**
 * Read-only detail view of a Compra (`GET /costos/compras/{id}`), opened
 * from elsewhere (e.g. the Pagos screen's Comprobantes Aplicados popup) to
 * let the user check what a comprobante is without navigating away to the
 * full editable Compra form. Also lists every pago applied to it (`GET
 * /costos/compras/{id}/pagos`) — a comprobante is often paid across more
 * than one pago (partial payments), so this can't just show the one pago
 * the caller came from.
 */
export const CompraDetailModal = ({ open, onClose, compraId }) => {
  const { data: compra, loading } = useFetch(open && compraId ? `/costos/compras/${compraId}` : null, {}, [compraId]);
  const { data: pagosAplicados, loading: loadingPagos } = useFetch(
    open && compraId ? `/costos/compras/${compraId}/pagos` : null, {}, [compraId],
  );
  const detalle = compra?.detalle || [];
  const impuestos = compra?.impuestos || [];
  const pagos = pagosAplicados || [];
  const adjuntos = (compra?.adjuntos || []).map(a => ({ ...a, url: adjuntoUrl(`/costos/compras/${compraId}`, a.id) }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle del Comprobante"
      size="lg"
      footer={<button className="btn btn-secondary" onClick={onClose}>Cerrar</button>}
    >
      {loading || !compra ? (
        <div style={{ padding: 24, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : (
        <>
          <div className="form-row">
            <div className="form-group field-w-sm">
              <div className="form-label">Proveedor</div>
              <div>{compra.proveedor_nombre}</div>
            </div>
            <div className="form-group field-w-sm">
              <div className="form-label">Tipo de Comprobante</div>
              <div>{TIPOS_COMPROBANTE.find(t => t.value === compra.tipo_comprobante)?.label || compra.tipo_comprobante}</div>
            </div>
            <div className="form-group field-w-sm">
              <div className="form-label">Número</div>
              <div>{compra.punto_venta ? `${compra.punto_venta}-${compra.numero}` : compra.numero}</div>
            </div>
            <div className="form-group field-w-sm">
              <div className="form-label">Fecha</div>
              <div>{compra.fecha}</div>
            </div>
            <div className="form-group field-w-sm">
              <div className="form-label">Fecha Vencimiento</div>
              <div>{compra.fecha_vencimiento}</div>
            </div>
            <div className="form-group field-w-sm">
              <div className="form-label">Condición de Pago</div>
              <div>{CONDICIONES_PAGO.find(c => c.value === compra.condicion_pago)?.label || compra.condicion_pago}</div>
            </div>
            <div className="form-group field-w-sm">
              <div className="form-label">Categoría</div>
              <div>{CATEGORIAS_COMPRA.find(c => c.value === compra.categoria)?.label || compra.categoria}</div>
            </div>
            <div className="form-group field-w-sm">
              <div className="form-label">Estado</div>
              <div>{compra.estado}</div>
            </div>
            <div className="form-group field-w-sm">
              <div className="form-label">Total</div>
              <div style={{ fontWeight: 600 }}>{formatCurrencyARS(compra.total)}</div>
            </div>
            <div className="form-group field-w-sm">
              <div className="form-label">Saldo Pendiente</div>
              <div style={{ fontWeight: 600 }}>{formatCurrencyARS(compra.saldo_pendiente)}</div>
            </div>
          </div>

          {compra.observaciones && (
            <div className="form-group" style={{ marginTop: 8 }}>
              <div className="form-label">Observaciones</div>
              <div>{compra.observaciones}</div>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <div className="form-label" style={{ marginBottom: 8 }}>Detalle</div>
            {detalle.length === 0 ? (
              <EmptyState icon={Package} title="Sin renglones" description="Este comprobante no tiene renglones de detalle." />
            ) : (
              <div className="table-container">
                <table>
                  <thead><tr><th>Descripción</th><th>Tipo</th><th>Cantidad</th><th>Precio Unit.</th><th>Alíc. IVA</th></tr></thead>
                  <tbody>
                    {detalle.map(r => (
                      <tr key={r.id}>
                        <td>{r.descripcion}</td>
                        <td>{DETALLE_TIPOS.find(t => t.value === r.tipo)?.label || r.tipo}</td>
                        <td>{r.cantidad}</td>
                        <td>{formatCurrencyARS(r.precio_unitario)}</td>
                        <td>{r.alicuota_iva}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {impuestos.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div className="form-label" style={{ marginBottom: 8 }}>Impuestos</div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Tipo</th><th>Importe</th></tr></thead>
                  <tbody>
                    {impuestos.map(r => (
                      <tr key={r.id}>
                        <td>{IMPUESTO_TIPOS.find(t => t.value === r.tipo)?.label || r.tipo}</td>
                        <td>{formatCurrencyARS(r.importe)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <div className="form-label" style={{ marginBottom: 8 }}>Adjuntos</div>
            {adjuntos.length === 0 ? (
              <EmptyState icon={Paperclip} title="Sin adjuntos" description="Este comprobante no tiene archivos adjuntos." />
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {adjuntos.map(a => (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'block', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 8, textDecoration: 'none' }}
                  >
                    {isImageAdjunto(a) ? (
                      <img src={a.url} alt={a.nombre || 'Adjunto'} style={{ maxWidth: 160, maxHeight: 160, borderRadius: 6, display: 'block' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '20px 12px' }}>
                        <Paperclip size={16} />
                        <span style={{ fontSize: 13 }}>{a.nombre || 'Adjunto'}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, marginTop: 6, color: 'var(--gray-500)' }}>
                      <span>{a.nombre || 'Adjunto'}</span>
                      <ExternalLink size={12} />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 20 }}>
            <div className="form-label" style={{ marginBottom: 8 }}>Pagos Aplicados</div>
            {loadingPagos ? (
              <div style={{ padding: 24, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : pagos.length === 0 ? (
              <EmptyState icon={Wallet} title="Sin pagos aplicados" description="Este comprobante todavía no tiene pagos aplicados." />
            ) : (
              <div className="table-container">
                <table>
                  <thead><tr><th>Fecha</th><th>Estado</th><th>Importe</th></tr></thead>
                  <tbody>
                    {pagos.map(p => (
                      <tr key={p.id}>
                        <td>{p.fecha}</td>
                        <td>{p.estado}</td>
                        <td>{formatCurrencyARS(p.importe)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  );
};
