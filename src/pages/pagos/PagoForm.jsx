import { useState } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Field } from '../../components/ui';
import { EntityPicker } from '../../components/form/EntityPicker';
import { PagoMediosEditor } from './PagoMediosEditor';
import { useFetch } from '../../hooks';
import { formatCurrencyARS } from '../../utils/format';
import { roundCurrency } from '../compras/compraTotals';
import { CATEGORIAS_COMPRA } from '../compras/constants';

const schema = z.object({
  proveedor_id: z.union([z.string(), z.number()]).nullable().refine(v => v !== null && v !== '', 'Seleccione un proveedor'),
  fecha: z.string().min(1, 'Ingrese la fecha'),
  observaciones: z.string().optional(),
});

const ESTADOS_APLICABLES = new Set(['PENDIENTE', 'PARCIAL']);

/**
 * Al elegir Proveedor, trae sus comprobantes pendientes/parciales y permite
 * cargar un "Importe a Aplicar" por fila; la suma determina el Total a
 * Cubrir que los Medios de Pago deben igualar. `onSubmit(values, aplicaciones)`
 * — el padre encadena `POST /costos/pagos` y, si `aplicaciones` no está
 * vacío, `POST /costos/pagos/{id}/aplicaciones` (design.md D7).
 */
export const PagoForm = ({ initialData, onSubmit }) => {
  const [medios, setMedios] = useState(initialData?.medios || []);
  const [aplicarImportes, setAplicarImportes] = useState({});
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      proveedor_id: null, fecha: new Date().toISOString().slice(0, 10), observaciones: '',
      ...initialData,
    },
  });
  const proveedorId = useWatch({ control, name: 'proveedor_id' });

  const { data: comprasProveedor, loading: loadingCompras } = useFetch(
    proveedorId ? '/costos/compras' : null, { proveedor_id: proveedorId, con_saldo: true }, [proveedorId],
  );
  const pendientes = (comprasProveedor?.items || comprasProveedor || [])
    .filter(c => ESTADOS_APLICABLES.has(c.estado));

  const setImporteAplicar = (compraId, value) => setAplicarImportes(prev => ({ ...prev, [compraId]: value }));

  const totalACubrir = roundCurrency(
    Object.values(aplicarImportes).reduce((sum, v) => sum + (Number(v) || 0), 0),
  );
  const mediosTotal = roundCurrency(medios.reduce((sum, m) => sum + Number(m.importe), 0));
  const mismatched = totalACubrir > 0 && mediosTotal !== totalACubrir;

  const submit = (values) => {
    if (medios.length === 0 || mismatched) return;
    const aplicaciones = Object.entries(aplicarImportes)
      .filter(([, v]) => Number(v) > 0)
      .map(([compra_id, importe]) => ({ compra_id: Number(compra_id), importe: Number(importe) }));
    onSubmit({ ...values, importe: mediosTotal, medios }, aplicaciones);
  };

  return (
    <form id="pago-form" onSubmit={handleSubmit(submit)}>
      <div className="card">
        <div className="card-header"><h3 className="card-title">Pago</h3></div>
        <div className="card-body form-row">
          <Field label="Proveedor" required error={errors.proveedor_id?.message} span={2}>
            <Controller
              name="proveedor_id"
              control={control}
              render={({ field }) => (
                <EntityPicker resource="/costos/proveedores" searchField="nombre" value={field.value} onChange={field.onChange} />
              )}
            />
          </Field>
          <Field label="Fecha" required error={errors.fecha?.message} size="sm">
            <input {...register('fecha')} type="date" className={`form-input ${errors.fecha ? 'error' : ''}`} />
          </Field>
          <Field label="Observaciones" error={errors.observaciones?.message} span={3}>
            <textarea {...register('observaciones')} className="form-textarea" rows={3} />
          </Field>
        </div>
      </div>

      {proveedorId && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header"><h3 className="card-title">Comprobantes Pendientes</h3></div>
          <div className="card-body">
            {loadingCompras ? (
              <div style={{ padding: 24, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : pendientes.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>
                Este proveedor no tiene comprobantes pendientes
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead><tr><th>Fecha</th><th>Número</th><th>Categoría</th><th>Saldo Pendiente</th><th>Importe a Aplicar</th></tr></thead>
                  <tbody>
                    {pendientes.map(c => (
                      <tr key={c.id}>
                        <td>{c.fecha}</td>
                        <td>{c.numero}</td>
                        <td>{CATEGORIAS_COMPRA.find(cat => cat.value === c.categoria)?.label || c.categoria}</td>
                        <td>{formatCurrencyARS(c.saldo_pendiente)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <input
                              type="number" step="0.01" min="0" max={c.saldo_pendiente}
                              className="form-input" style={{ width: 120 }}
                              value={aplicarImportes[c.id] || ''}
                              onChange={e => setImporteAplicar(c.id, e.target.value)}
                            />
                            <button
                              type="button" className="btn btn-ghost btn-sm"
                              title="Copiar saldo pendiente"
                              onClick={() => setImporteAplicar(c.id, c.saldo_pendiente)}
                            >
                              Copiar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} style={{ fontWeight: 700 }}>Total a Cubrir</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrencyARS(totalACubrir)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <PagoMediosEditor medios={medios} onChange={setMedios} />
      {medios.length === 0 && (
        <div className="form-error" style={{ marginTop: 8 }}>Agregue al menos un medio de pago</div>
      )}
      {mismatched && (
        <div className="form-error" style={{ marginTop: 8 }}>
          El total de medios de pago ({formatCurrencyARS(mediosTotal)}) debe coincidir con el Total a
          Cubrir ({formatCurrencyARS(totalACubrir)})
        </div>
      )}
    </form>
  );
};
