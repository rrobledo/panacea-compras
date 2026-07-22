import { useState, useEffect } from 'react';
import { Eye, FileText } from 'lucide-react';
import { Modal, EmptyState } from '../../components/ui';
import { CompraDetailModal } from '../compras/CompraDetailModal';
import { CATEGORIAS_COMPRA } from '../compras/constants';
import { useFetch } from '../../hooks';
import { api } from '../../services/api';
import { formatCurrencyARS } from '../../utils/format';

/**
 * Read-only view of the comprobantes (compras) a pago has been applied to
 * (`GET /costos/pagos/{id}/aplicaciones`, whose `comprobante` field is the
 * Número — no extra call needed for that). Fecha and the comprobante's own
 * Total still aren't in that response, so each aplicación's compra is
 * resolved via `GET /costos/compras/{compra_id}` to fill those in. Replaces
 * the former "Aplicar a Compra" action on the Pagos screen — applying is
 * now only initiated from a Compra's edit page (see `AplicarPagoModal`).
 * Each row can also open a read-only `CompraDetailModal` for the affected
 * comprobante.
 */
export const ComprobantesAplicadosModal = ({ open, onClose, pago }) => {
  const [detailCompraId, setDetailCompraId] = useState(null);
  const { data: aplicaciones, loading: loadingAplicaciones } = useFetch(
    pago ? `/costos/pagos/${pago.id}/aplicaciones` : null, {}, [pago?.id],
  );
  const items = aplicaciones || [];

  const [comprasById, setComprasById] = useState({});
  const [loadingCompras, setLoadingCompras] = useState(false);
  const compraIds = [...new Set(items.map(a => a.compra_id))];

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (compraIds.length === 0) {
        if (!cancelled) setComprasById({});
        return;
      }
      setLoadingCompras(true);
      const entries = await Promise.all(compraIds.map(id =>
        api.get(`/costos/compras/${id}`).then(res => [id, res.data]).catch(() => [id, null]),
      ));
      if (!cancelled) { setComprasById(Object.fromEntries(entries)); setLoadingCompras(false); }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(compraIds)]);

  const loading = loadingAplicaciones || loadingCompras;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Comprobantes Aplicados"
      size="xl"
      footer={<button className="btn btn-secondary" onClick={onClose}>Cerrar</button>}
    >
      {loading ? (
        <div style={{ padding: 24, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={FileText} title="Sin comprobantes aplicados"
          description="Este pago todavía no fue aplicado a ningún comprobante." />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Número</th><th>Proveedor</th><th>Fecha Comprobante</th><th>Categoría</th><th>Importe Comprobante</th>
                <th>Importe Aplicado</th><th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(a => {
                const compra = comprasById[a.compra_id];
                return (
                  <tr key={a.id}>
                    <td>{a.comprobante ?? compra?.numero ?? a.compra_id}</td>
                    <td>{compra?.proveedor_nombre ?? pago?.proveedor_nombre}</td>
                    <td>{compra?.fecha ?? '—'}</td>
                    <td>{compra ? (CATEGORIAS_COMPRA.find(c => c.value === compra.categoria)?.label || compra.categoria) : '—'}</td>
                    <td>{compra ? formatCurrencyARS(compra.total) : '—'}</td>
                    <td>{formatCurrencyARS(a.importe)}</td>
                    <td>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDetailCompraId(a.compra_id)}>
                        <Eye size={14} /> Ver Detalle
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CompraDetailModal
        open={!!detailCompraId}
        onClose={() => setDetailCompraId(null)}
        compraId={detailCompraId}
      />
    </Modal>
  );
};
