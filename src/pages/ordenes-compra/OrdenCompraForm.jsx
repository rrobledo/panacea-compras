import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Field, StatusBadge } from '../../components/ui';
import { EntityPicker } from '../../components/form/EntityPicker';

const schema = z.object({
  proveedor_id: z.union([z.string(), z.number()]).nullable().refine(v => v !== null && v !== '', 'Seleccione un proveedor'),
  fecha: z.string().min(1, 'Ingrese la fecha'),
  fecha_entrega_estimada: z.string().optional().or(z.literal('')),
  observaciones: z.string().optional(),
});

export const OrdenCompraForm = ({ initialData, onSubmit }) => {
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      proveedor_id: null, fecha: new Date().toISOString().slice(0, 10),
      fecha_entrega_estimada: '', observaciones: '',
      ...initialData,
    },
  });

  return (
    <form id="orden-compra-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Orden de Compra</h3>
          {initialData?.estado && <StatusBadge status={initialData.estado} />}
        </div>
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
          <Field label="Fecha Entrega Estimada" error={errors.fecha_entrega_estimada?.message} size="sm">
            <input {...register('fecha_entrega_estimada')} type="date" className="form-input" />
          </Field>
          <Field label="Observaciones" error={errors.observaciones?.message} span={3}>
            <textarea {...register('observaciones')} className="form-textarea" rows={3} />
          </Field>
        </div>
      </div>
    </form>
  );
};
