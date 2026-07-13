import { useState } from 'react';
import { Plus, ClipboardList } from 'lucide-react';
import { Modal, EmptyState, Field } from '../../components/ui';
import { EntityPicker } from '../../components/form/EntityPicker';
import { formatCurrencyARS } from '../../utils/format';

/**
 * Detalle line editor for an Orden de Compra. `cantidad_recibida` (when
 * present, on an existing line) is always read-only — it's advanced
 * server-side by creating a `Compra` against this orden (see the
 * `ordenes-compra` spec's "Recepción progress display" requirement).
 */
export const OrdenCompraDetalleEditor = ({ items, onAdd, onRemove }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [row, setRow] = useState({ insumo_id: null, descripcion: '', cantidad_pedida: '', precio_unitario_estimado: '' });
  const [pickedNombre, setPickedNombre] = useState('');

  const openAdd = () => { setRow({ insumo_id: null, descripcion: '', cantidad_pedida: '', precio_unitario_estimado: '' }); setPickedNombre(''); setModalOpen(true); };

  const canStage = row.cantidad_pedida !== '' && (row.insumo_id != null || row.descripcion.trim() !== '');

  const handleStage = () => {
    onAdd({
      insumo_id: row.insumo_id,
      descripcion: row.descripcion || pickedNombre,
      cantidad_pedida: Number(row.cantidad_pedida),
      precio_unitario_estimado: Number(row.precio_unitario_estimado || 0),
      cantidad_recibida: 0,
    });
    setModalOpen(false);
  };

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-header">
        <h3 className="card-title">Detalle</h3>
        <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>
          <Plus size={14} /> Agregar Insumo
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Sin insumos cargados" description="Esta orden de compra todavía no tiene insumos." />
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Descripción</th><th>Cant. Pedida</th><th>Cant. Recibida</th><th>Precio Unit. Estimado</th><th></th></tr></thead>
            <tbody>
              {items.map(r => (
                <tr key={r.id} className={r._pending ? 'row-pending' : ''}>
                  <td>{r.descripcion}{r._pending && <span className="pending-badge">pendiente</span>}</td>
                  <td>{r.cantidad_pedida}</td>
                  <td>{r.cantidad_recibida ?? 0}</td>
                  <td>{formatCurrencyARS(r.precio_unitario_estimado)}</td>
                  <td>
                    {r._pending && (
                      <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => onRemove(r.id)}>Quitar</button>
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
        title="Agregar Insumo"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleStage} disabled={!canStage}>Agregar</button>
        </>}
      >
        <div className="form-row">
          <Field label="Insumo (opcional)" span={2}>
            <EntityPicker
              resource="/costos/insumos"
              searchField="nombre"
              value={row.insumo_id}
              onChange={v => setRow(r => ({ ...r, insumo_id: v }))}
              onSelectRow={r => { setPickedNombre(r.nombre); if (!row.descripcion) setRow(prev => ({ ...prev, descripcion: r.nombre })); }}
            />
          </Field>
          <Field label="Descripción" span={2}>
            <input className="form-input" value={row.descripcion} onChange={e => setRow(r => ({ ...r, descripcion: e.target.value }))} placeholder={pickedNombre} />
          </Field>
          <Field label="Cantidad Pedida" required size="sm">
            <input type="number" step="any" className="form-input" value={row.cantidad_pedida} onChange={e => setRow(r => ({ ...r, cantidad_pedida: e.target.value }))} />
          </Field>
          <Field label="Precio Unitario Estimado" size="sm">
            <input type="number" step="0.01" className="form-input" value={row.precio_unitario_estimado} onChange={e => setRow(r => ({ ...r, precio_unitario_estimado: e.target.value }))} />
          </Field>
        </div>
      </Modal>
    </div>
  );
};
