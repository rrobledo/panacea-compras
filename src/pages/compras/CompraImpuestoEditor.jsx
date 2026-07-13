import { useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { Modal, ConfirmDialog, EmptyState, Field } from '../../components/ui';
import { useConfirm } from '../../hooks';
import { formatCurrencyARS } from '../../utils/format';
import { IMPUESTO_TIPOS } from './constants';

const emptyRow = () => ({ tipo: 'PERCEPCION_IVA', importe: '' });

/**
 * Repeatable-row editor over `CompraImpuesto`'s fixed tipo vocabulary
 * (Percepciones/Retenciones/Otros Tributos — no IVA, ver
 * `compraTotals.js`: el IVA se deriva de Detalle, cargarlo también acá lo
 * duplicaría). Solo pide Tipo e Importe, sin Base Imponible ni
 * Porcentaje (design.md D6).
 */
export const CompraImpuestoEditor = ({ items, loading = false, onAdd, onRemove, allowNegative = false }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [row, setRow] = useState(emptyRow());
  const { confirm, dialog, resolve } = useConfirm();

  const openAdd = () => { setRow(emptyRow()); setModalOpen(true); };

  const canStage = row.importe !== '' && (allowNegative || Number(row.importe) >= 0);

  const handleStage = () => {
    onAdd({ tipo: row.tipo, importe: Number(row.importe) });
    setModalOpen(false);
  };

  const handleRemove = async (r) => {
    const ok = await confirm({
      title: 'Confirmar eliminación',
      message: `¿Está seguro que desea quitar el impuesto "${IMPUESTO_TIPOS.find(t => t.value === r.tipo)?.label || r.tipo}"?`,
    });
    if (ok) onRemove(r.id);
  };

  return (
    <>
      <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>
          <Plus size={14} /> Agregar Impuesto
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Sin impuestos cargados"
          description="Esta compra todavía no tiene renglones de impuestos (percepciones, retenciones, otros tributos)."
          action={<button type="button" className="btn btn-secondary btn-sm" onClick={openAdd}>Agregar el primero</button>}
        />
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Tipo</th><th>Importe</th><th></th></tr></thead>
            <tbody>
              {items.map(r => (
                <tr key={r.id} className={r._pending ? 'row-pending' : ''}>
                  <td>{IMPUESTO_TIPOS.find(t => t.value === r.tipo)?.label || r.tipo}{r._pending && <span className="pending-badge">pendiente</span>}</td>
                  <td>{formatCurrencyARS(r.importe)}</td>
                  <td>
                    {/* Only newly-staged rows can be un-staged locally — the backend has no
                        endpoint to delete an already-persisted CompraImpuesto row. */}
                    {r._pending && (
                      <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => handleRemove(r)}>Quitar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Agregar Impuesto"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleStage} disabled={!canStage}>Agregar</button>
        </>}
      >
        <div className="form-row">
          <Field label="Tipo" span={2}>
            <select className="form-select" value={row.tipo} onChange={e => setRow(r => ({ ...r, tipo: e.target.value }))}>
              {IMPUESTO_TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Importe" required size="sm" hint={allowNegative ? 'Puede ser negativo (Nota de Crédito)' : undefined}>
            <input type="number" step="0.01" className="form-input" value={row.importe} onChange={e => setRow(r => ({ ...r, importe: e.target.value }))} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!dialog}
        title={dialog?.title}
        message={dialog?.message}
        onConfirm={() => resolve(true)}
        onCancel={() => resolve(false)}
      />
    </>
  );
};
