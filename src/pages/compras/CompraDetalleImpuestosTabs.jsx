import { useState } from 'react';
import { Tabs } from '../../components/ui';
import { CompraDetalleEditor } from './CompraDetalleEditor';
import { CompraImpuestoEditor } from './CompraImpuestoEditor';

/**
 * Hosts Detalle and Impuestos as tabs of a single card instead of two
 * stacked cards — both editors render their own buttons/table/modal, this
 * just owns the outer card and which one is visible.
 */
export const CompraDetalleImpuestosTabs = ({ detalle, impuestos, onAddDetalle, onEditDetalle, onRemoveDetalle, onAddImpuesto, onRemoveImpuesto, allowNegativeImpuestos }) => {
  const [activeTab, setActiveTab] = useState('detalle');

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-header">
        <Tabs
          tabs={[
            { value: 'detalle', label: 'Detalle', count: detalle.length || undefined },
            { value: 'impuestos', label: 'Impuestos', count: impuestos.length || undefined },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <div className="card-body" style={{ display: activeTab === 'detalle' ? undefined : 'none' }}>
        <CompraDetalleEditor items={detalle} onAdd={onAddDetalle} onEdit={onEditDetalle} onRemove={onRemoveDetalle} />
      </div>
      <div className="card-body" style={{ display: activeTab === 'impuestos' ? undefined : 'none' }}>
        <CompraImpuestoEditor items={impuestos} onAdd={onAddImpuesto} onRemove={onRemoveImpuesto} allowNegative={allowNegativeImpuestos} />
      </div>
    </div>
  );
};
