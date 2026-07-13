import { useState } from 'react';
import { Plus, Package } from 'lucide-react';
import { Modal, ConfirmDialog, EmptyState, Field } from '../../components/ui';
import { EntityPicker } from '../../components/form/EntityPicker';
import { useConfirm } from '../../hooks';
import { formatCurrencyARS } from '../../utils/format';
import { DETALLE_TIPOS, ALICUOTAS_IVA } from './constants';

const emptyRow = (tipo = 'INSUMO') => ({
  tipo, insumo_id: null, item_gasto_id: null, descripcion: '',
  cantidad: '', precio_unitario: '', porcentaje_descuento: '0', alicuota_iva: '21',
});

/**
 * Presentational Detalle de Insumos/Gastos table + add modal for a Compra.
 * No fetching, no network — the caller supplies `items` and add/remove
 * callbacks, whether backed by staged-then-committed state (Edit) or purely
 * local state until the parent form submits (Create). Mirrors the shape of
 * the legacy `InsumosLinesEditor` extended with a per-row tipo selector
 * (Insumo / Ítem de Gasto / Texto Libre), per design.md D2. A dedicated
 * button per tipo (Insumo / Ítem de Gasto / Descripción) opens the modal
 * pre-set to that tipo; the tipo selector inside the modal stays editable.
 */
export const CompraDetalleEditor = ({ items, loading = false, onAdd, onEdit, onRemove }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [row, setRow] = useState(emptyRow());
  const [pickedNombre, setPickedNombre] = useState('');
  const { confirm, dialog, resolve } = useConfirm();

  const openAdd = (tipo) => { setRow(emptyRow(tipo)); setPickedNombre(''); setModalOpen(true); };

  const setField = (field, value) => setRow(r => ({ ...r, [field]: value }));

  const setTipo = (tipo) => setRow(r => ({
    ...emptyRow(), tipo, cantidad: r.cantidad, precio_unitario: r.precio_unitario,
    porcentaje_descuento: r.porcentaje_descuento, alicuota_iva: r.alicuota_iva,
  }));

  const canStage = Number(row.cantidad) > 0 && row.precio_unitario !== '' && Number(row.precio_unitario) >= 0
    && (row.tipo !== 'LIBRE' ? (row.tipo === 'INSUMO' ? row.insumo_id != null : row.item_gasto_id != null)
      : row.descripcion.trim() !== '');

  const handleStage = () => {
    const descripcion = row.tipo === 'LIBRE' ? row.descripcion : (row.descripcion || pickedNombre);
    onAdd({
      tipo: row.tipo,
      insumo_id: row.tipo === 'INSUMO' ? row.insumo_id : null,
      item_gasto_id: row.tipo === 'ITEM_GASTO' ? row.item_gasto_id : null,
      descripcion,
      cantidad: Number(row.cantidad),
      precio_unitario: Number(row.precio_unitario),
      porcentaje_descuento: Number(row.porcentaje_descuento || 0),
      alicuota_iva: Number(row.alicuota_iva || 0),
    });
    setModalOpen(false);
  };

  const lineTotal = (r) => {
    const bruto = Number(r.cantidad) * Number(r.precio_unitario);
    const neto = bruto - bruto * Number(r.porcentaje_descuento || 0) / 100;
    return neto + neto * Number(r.alicuota_iva || 0) / 100;
  };

  const editField = (r, field, value) => {
    if (value === '') return;
    const num = Number(value);
    if (Number.isNaN(num)) return;
    if (field === 'cantidad' && num <= 0) return;
    if (field === 'precio_unitario' && num < 0) return;
    onEdit?.(r.id, { [field]: num });
  };

  const handleRemove = async (r) => {
    const ok = await confirm({
      title: 'Confirmar eliminación',
      message: `¿Está seguro que desea quitar el renglón "${r.descripcion}" de esta compra?`,
    });
    if (ok) onRemove(r.id);
  };

  return (
    <>
      <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => openAdd('INSUMO')}>
          <Plus size={14} /> Agregar Insumo
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => openAdd('ITEM_GASTO')}>
          <Plus size={14} /> Agregar Ítem de Gasto
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => openAdd('LIBRE')}>
          <Plus size={14} /> Agregar Descripción
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Sin renglones cargados"
          description="Esta compra todavía no tiene renglones de detalle."
        />
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Descripción</th><th>Tipo</th><th>Cantidad</th><th>Precio Unit.</th><th>Alíc. IVA</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {items.map(r => (
                <tr key={r.id} className={r._pending ? 'row-pending' : ''}>
                  <td>{r.descripcion}{r._pending && <span className="pending-badge">pendiente</span>}</td>
                  <td>{DETALLE_TIPOS.find(t => t.value === r.tipo)?.label || r.tipo}</td>
                  <td>
                    {r._pending ? (
                      <input type="number" step="any" min="0" className="form-input" style={{ width: 90 }}
                        defaultValue={r.cantidad} onBlur={e => editField(r, 'cantidad', e.target.value)} />
                    ) : r.cantidad}
                  </td>
                  <td>
                    {r._pending ? (
                      <input type="number" step="0.01" min="0" className="form-input" style={{ width: 110 }}
                        defaultValue={r.precio_unitario} onBlur={e => editField(r, 'precio_unitario', e.target.value)} />
                    ) : formatCurrencyARS(r.precio_unitario)}
                  </td>
                  <td>{r.alicuota_iva}%</td>
                  <td>{formatCurrencyARS(lineTotal(r))}</td>
                  <td>
                    {/* Only newly-staged rows can be un-staged locally — the backend has no
                        endpoint to delete an already-persisted CompraDetalle row. */}
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
        title={`Agregar ${DETALLE_TIPOS.find(t => t.value === row.tipo)?.label || 'Renglón'}`}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleStage} disabled={!canStage}>Agregar</button>
        </>}
      >
        <div className="form-row">
          <Field label="Tipo" size="md">
            <select className="form-select" value={row.tipo} onChange={e => setTipo(e.target.value)}>
              {DETALLE_TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>

          {row.tipo === 'INSUMO' && (
            <Field label="Insumo" span={2}>
              <EntityPicker
                resource="/costos/insumos"
                searchField="nombre"
                value={row.insumo_id}
                onChange={v => setField('insumo_id', v)}
                onSelectRow={r => { setPickedNombre(r.nombre); if (!row.descripcion) setField('descripcion', r.nombre); }}
              />
            </Field>
          )}
          {row.tipo === 'ITEM_GASTO' && (
            <Field label="Ítem de Gasto" span={2}>
              <EntityPicker
                resource="/costos/items-gasto"
                searchField="nombre"
                value={row.item_gasto_id}
                onChange={v => setField('item_gasto_id', v)}
                onSelectRow={r => { setPickedNombre(r.nombre); if (!row.descripcion) setField('descripcion', r.nombre); }}
              />
            </Field>
          )}
          {row.tipo === 'LIBRE' && (
            <Field label="Descripción" required span={2}>
              <input className="form-input" value={row.descripcion} onChange={e => setField('descripcion', e.target.value)} />
            </Field>
          )}
          {row.tipo !== 'LIBRE' && (
            <Field label="Descripción (opcional, sobreescribe el nombre del catálogo)" span={3}>
              <input className="form-input" value={row.descripcion} onChange={e => setField('descripcion', e.target.value)} placeholder={pickedNombre} />
            </Field>
          )}

          <Field label="Cantidad" required size="sm">
            <input type="number" step="any" min="0" className="form-input" value={row.cantidad} onChange={e => setField('cantidad', e.target.value)} />
          </Field>
          <Field label="Precio Unitario" required size="sm">
            <input type="number" step="0.01" min="0" className="form-input" value={row.precio_unitario} onChange={e => setField('precio_unitario', e.target.value)} />
          </Field>
          <Field label="% Descuento" size="sm">
            <input type="number" step="0.01" min="0" className="form-input" value={row.porcentaje_descuento} onChange={e => setField('porcentaje_descuento', e.target.value)} />
          </Field>
          <Field label="Alícuota IVA" size="sm">
            <select className="form-select" value={row.alicuota_iva} onChange={e => setField('alicuota_iva', e.target.value)}>
              {ALICUOTAS_IVA.map(a => <option key={a} value={a}>{a}%</option>)}
            </select>
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
