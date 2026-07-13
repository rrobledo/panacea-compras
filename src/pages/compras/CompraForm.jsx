import { useEffect } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Field } from '../../components/ui';
import { EntityPicker } from '../../components/form/EntityPicker';
import { api } from '../../services/api';
import { TIPOS_COMPROBANTE, CONDICIONES_PAGO } from './constants';

const schema = z.object({
  proveedor_id: z.union([z.string(), z.number()]).nullable().refine(v => v !== null && v !== '', 'Seleccione un proveedor'),
  tipo_comprobante: z.string().min(1, 'Seleccione el tipo de comprobante'),
  punto_venta: z.string().optional(),
  numero: z.string().min(1, 'Ingrese el número de comprobante'),
  fecha: z.string().min(1, 'Ingrese la fecha'),
  fecha_vencimiento: z.string().min(1, 'Ingrese la fecha de vencimiento'),
  condicion_pago: z.string().min(1, 'Seleccione la condición de pago'),
  orden_compra_id: z.union([z.string(), z.number()]).nullable().optional(),
  descuento_general: z.string().optional(),
  importe_exento: z.string().optional(),
  importe_no_gravado: z.string().optional(),
  observaciones: z.string().optional(),
});

// Se notifica al padre en cada cambio de valores (no solo al submit): la
// vista previa de Totales y la sección de Pago en Contado (design.md D4/D6)
// necesitan tipo_comprobante/condicion_pago/descuento_general/exento/no
// gravado en vivo, antes de que el usuario guarde el formulario.
export const CompraForm = ({ initialData, onSubmit, onOrdenCompraSelect, onValuesChange }) => {
  const today = new Date().toISOString().slice(0, 10);
  const { register, handleSubmit, control, setValue, formState: { errors, dirtyFields } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      proveedor_id: null, tipo_comprobante: 'FACTURA_A', punto_venta: '', numero: '',
      fecha: today, fecha_vencimiento: today,
      condicion_pago: 'CUENTA_CORRIENTE', orden_compra_id: null,
      descuento_general: '0', importe_exento: '0', importe_no_gravado: '0', observaciones: '',
      ...initialData,
    },
  });
  const proveedorId = useWatch({ control, name: 'proveedor_id' });
  const fecha = useWatch({ control, name: 'fecha' });
  const watchedValues = useWatch({ control });

  useEffect(() => { onValuesChange?.(watchedValues); }, [watchedValues, onValuesChange]);

  // Fecha Vencimiento sigue a Fecha por defecto hasta que el usuario la
  // edite directamente (a partir de ahí queda libre).
  useEffect(() => {
    if (!dirtyFields.fecha_vencimiento) setValue('fecha_vencimiento', fecha);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha]);

  const handleProveedorSelect = async (proveedorId) => {
    if (initialData?.id != null) return; // don't override an existing compra's condicion_pago
    try {
      const res = await api.get(`/costos/proveedores/${proveedorId}`);
      if (res.data?.condicion_pago) setValue('condicion_pago', res.data.condicion_pago);
    } catch {
      // couldn't resolve the proveedor's default — leave the current selection as-is
    }
  };

  const handleOrdenCompraSelect = async (row) => {
    try {
      const res = await api.get(`/costos/ordenes-compra/${row.id}`);
      onOrdenCompraSelect?.(res.data);
    } catch {
      // couldn't load the orden's detalle — leave it to be added manually
    }
  };

  return (
    <form id="compra-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="card">
        <div className="card-header"><h3 className="card-title">Comprobante</h3></div>
        <div className="card-body form-row">
          <Field label="Proveedor" required error={errors.proveedor_id?.message} span={2}>
            <Controller
              name="proveedor_id"
              control={control}
              render={({ field }) => (
                <EntityPicker
                  resource="/costos/proveedores"
                  searchField="nombre"
                  value={field.value}
                  onChange={field.onChange}
                  onSelectRow={(row) => handleProveedorSelect(row.id)}
                />
              )}
            />
          </Field>
          <Field label="Tipo de Comprobante" required error={errors.tipo_comprobante?.message} size="md">
            <select {...register('tipo_comprobante')} className={`form-select ${errors.tipo_comprobante ? 'error' : ''}`}>
              {TIPOS_COMPROBANTE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>

          <Field label="Punto de Venta" error={errors.punto_venta?.message} size="sm">
            <input {...register('punto_venta')} className="form-input" />
          </Field>
          <Field label="Número" required error={errors.numero?.message} size="sm">
            <input {...register('numero')} className={`form-input ${errors.numero ? 'error' : ''}`} />
          </Field>
          <Field label="Fecha" required error={errors.fecha?.message} size="sm">
            <input {...register('fecha')} type="date" className={`form-input ${errors.fecha ? 'error' : ''}`} />
          </Field>
          <Field label="Fecha Vencimiento" required error={errors.fecha_vencimiento?.message} size="sm">
            <input {...register('fecha_vencimiento')} type="date" className={`form-input ${errors.fecha_vencimiento ? 'error' : ''}`} />
          </Field>

          <Field label="Condición de Pago" required error={errors.condicion_pago?.message} size="md">
            <select {...register('condicion_pago')} className="form-select">
              {CONDICIONES_PAGO.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          {!initialData?.id && (
            <Field
              label="Orden de Compra"
              error={errors.orden_compra_id?.message}
              size="md"
              hint={!proveedorId ? 'Seleccione un proveedor primero' : undefined}
            >
              <Controller
                name="orden_compra_id"
                control={control}
                render={({ field }) => (
                  <EntityPicker
                    resource="/costos/ordenes-compra"
                    searchField="fecha"
                    value={field.value}
                    onChange={field.onChange}
                    onSelectRow={handleOrdenCompraSelect}
                    disabled={!proveedorId}
                    extraParams={{ proveedor_id: proveedorId }}
                    filterResults={(rows) => rows.filter(r => r.estado === 'PENDIENTE')}
                    minQueryLength={0}
                    columns={[{ field: 'id', header: 'Número' }, { field: 'fecha', header: 'Fecha' }]}
                    renderLabel={(row) => `N° ${row.id} — ${row.fecha}`}
                  />
                )}
              />
            </Field>
          )}

          <Field label="% Descuento General" error={errors.descuento_general?.message} size="sm">
            <input {...register('descuento_general')} type="number" step="0.01" min="0" className="form-input" />
          </Field>
          <Field label="Importe Exento" error={errors.importe_exento?.message} size="sm">
            <input {...register('importe_exento')} type="number" step="0.01" min="0" className="form-input" />
          </Field>
          <Field label="Importe No Gravado" error={errors.importe_no_gravado?.message} size="sm">
            <input {...register('importe_no_gravado')} type="number" step="0.01" min="0" className="form-input" />
          </Field>

          <Field label="Observaciones" error={errors.observaciones?.message} span={3}>
            <textarea {...register('observaciones')} className="form-textarea" rows={3} />
          </Field>
        </div>
      </div>
    </form>
  );
};
