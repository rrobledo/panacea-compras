import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal, Field } from '../../components/ui';
import { formatCurrencyARS } from '../../utils/format';
import { TIPOS_MEDIO, REQUIRES_BANKING_FIELDS } from './constants';

const emptyRow = () => ({ tipo: 'TRANSFERENCIA', importe: '', banco: '', numero: '', fecha_acreditacion: '' });

/**
 * Repeatable Medios de Pago editor — one Pago can be split across multiple
 * payment methods, each with its own importe; Cheque/Echeq additionally
 * require banking fields (per the `tesoreria-pagos` spec).
 */
export const PagoMediosEditor = ({ medios, onChange }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [row, setRow] = useState(emptyRow());

  const requiresBanking = REQUIRES_BANKING_FIELDS.has(row.tipo);
  const canStage = row.importe !== '' && (!requiresBanking || (row.banco && row.numero && row.fecha_acreditacion));

  const openAdd = () => { setRow(emptyRow()); setModalOpen(true); };

  const handleStage = () => {
    onChange([...medios, {
      tipo: row.tipo,
      importe: Number(row.importe),
      ...(requiresBanking ? { banco: row.banco, numero: row.numero, fecha_acreditacion: row.fecha_acreditacion } : {}),
    }]);
    setModalOpen(false);
  };

  const handleRemove = (i) => onChange(medios.filter((_, j) => j !== i));

  const total = medios.reduce((sum, m) => sum + Number(m.importe), 0);

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-header">
        <h3 className="card-title">Medios de Pago</h3>
        <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>
          <Plus size={14} /> Agregar Medio
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead><tr><th>Tipo</th><th>Importe</th><th>Banco</th><th>Número</th><th>Fecha Acreditación</th><th></th></tr></thead>
          <tbody>
            {medios.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--gray-400)' }}>Sin medios de pago cargados</td></tr>
            ) : medios.map((m, i) => (
              <tr key={i}>
                <td>{TIPOS_MEDIO.find(t => t.value === m.tipo)?.label || m.tipo}</td>
                <td>{formatCurrencyARS(m.importe)}</td>
                <td>{m.banco || '—'}</td>
                <td>{m.numero || '—'}</td>
                <td>{m.fecha_acreditacion || '—'}</td>
                <td>
                  <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => handleRemove(i)}>Quitar</button>
                </td>
              </tr>
            ))}
          </tbody>
          {medios.length > 0 && (
            <tfoot>
              <tr>
                <td style={{ fontWeight: 700 }}>Total Medios</td>
                <td style={{ fontWeight: 700 }}>{formatCurrencyARS(total)}</td>
                <td colSpan={4}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Agregar Medio de Pago"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleStage} disabled={!canStage}>Agregar</button>
        </>}
      >
        <div className="form-row">
          <Field label="Tipo" size="md">
            <select className="form-select" value={row.tipo} onChange={e => setRow(r => ({ ...r, tipo: e.target.value }))}>
              {TIPOS_MEDIO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Importe" required size="sm">
            <input type="number" step="0.01" className="form-input" value={row.importe} onChange={e => setRow(r => ({ ...r, importe: e.target.value }))} />
          </Field>
          {requiresBanking && (
            <>
              <Field label="Banco" required size="md">
                <input className="form-input" value={row.banco} onChange={e => setRow(r => ({ ...r, banco: e.target.value }))} />
              </Field>
              <Field label="Número" required size="sm">
                <input className="form-input" value={row.numero} onChange={e => setRow(r => ({ ...r, numero: e.target.value }))} />
              </Field>
              <Field label="Fecha Acreditación" required size="sm">
                <input type="date" className="form-input" value={row.fecha_acreditacion} onChange={e => setRow(r => ({ ...r, fecha_acreditacion: e.target.value }))} />
              </Field>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
