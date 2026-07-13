import { useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { EmptyState } from '../../components/ui';
import { AplicarPagoModal } from '../pagos/AplicarPagoModal';
import { useFetch } from '../../hooks';
import { formatCurrencyARS } from '../../utils/format';

/**
 * Read-only list of pagos applied to a compra (`GET /costos/compras/{id}/pagos`),
 * per design.md D4 — pagos are a standalone resource (N:M via PagoAplicacion),
 * not staged/nested the way Detalle/Impuestos are.
 */
export const PagosAplicadosPanel = ({ compraId, compra }) => {
  const { data, loading, refetch } = useFetch(`/costos/compras/${compraId}/pagos`);
  const [modalOpen, setModalOpen] = useState(false);
  const pagos = data || [];

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-header">
        <h3 className="card-title">Pagos Aplicados</h3>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
          <Plus size={14} /> Aplicar Pago
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : pagos.length === 0 ? (
        <EmptyState icon={Wallet} title="Sin pagos aplicados" description="Esta compra todavía no tiene pagos aplicados." />
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Fecha</th><th>Importe Aplicado</th></tr></thead>
            <tbody>
              {pagos.map(p => (
                <tr key={p.id}>
                  <td>{p.fecha}</td>
                  <td>{formatCurrencyARS(p.importe)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AplicarPagoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        proveedorId={compra?.proveedor_id}
        preselectedCompra={{ id: compraId, saldo_pendiente: compra?.saldo_pendiente, numero: compra?.numero }}
        onApplied={() => { setModalOpen(false); refetch(); }}
      />
    </div>
  );
};
