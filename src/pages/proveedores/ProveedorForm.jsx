import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X } from 'lucide-react';
import { Field } from '../../components/ui';
import { CONDICIONES_IVA, CONDICIONES_PAGO } from './constants';

const schema = z.object({
  codigo: z.string().optional(),
  nombre: z.string().min(1, 'Ingrese el nombre'),
  nombre_fantasia: z.string().optional(),
  cuit: z.string().min(1, 'Ingrese el CUIT'),
  condicion_iva: z.enum(CONDICIONES_IVA.map(c => c.value), { message: 'Seleccione una condición de IVA' }),
  condicion_pago: z.string().min(1),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().optional(),
});

export const ProveedorForm = ({ initialData, onSubmit, onCancel, saving }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      codigo: '', nombre: '', nombre_fantasia: '', cuit: '',
      condicion_iva: '', condicion_pago: 'CUENTA_CORRIENTE',
      telefono: '', email: '', direccion: '', ...initialData,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="card">
        <div className="card-header"><h3 className="card-title">Información del Proveedor</h3></div>
        <div className="card-body form-row">
          {initialData?.id != null && (
            <Field label="Id" size="xs">
              <input className="form-input" value={initialData.id} readOnly style={{ background: 'var(--gray-50)' }} />
            </Field>
          )}
          <Field label="Código" error={errors.codigo?.message} size="sm">
            <input {...register('codigo')} className="form-input" />
          </Field>
          <Field label="Nombre" required error={errors.nombre?.message}>
            <input {...register('nombre')} className={`form-input ${errors.nombre ? 'error' : ''}`} />
          </Field>
          <Field label="Nombre de Fantasía" error={errors.nombre_fantasia?.message}>
            <input {...register('nombre_fantasia')} className="form-input" />
          </Field>
          <Field label="CUIT" required error={errors.cuit?.message} size="sm">
            <input {...register('cuit')} className={`form-input ${errors.cuit ? 'error' : ''}`} />
          </Field>
          <Field label="Condición de IVA" required error={errors.condicion_iva?.message} size="md">
            <select {...register('condicion_iva')} className={`form-select ${errors.condicion_iva ? 'error' : ''}`}>
              <option value="">Seleccione condición</option>
              {CONDICIONES_IVA.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Condición de Pago" error={errors.condicion_pago?.message} size="md">
            <select {...register('condicion_pago')} className="form-select">
              {CONDICIONES_PAGO.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Teléfono" error={errors.telefono?.message} size="sm">
            <input {...register('telefono')} className="form-input" />
          </Field>
          <Field label="Email" error={errors.email?.message} size="md">
            <input {...register('email')} type="email" className={`form-input ${errors.email ? 'error' : ''}`} />
          </Field>
          <Field label="Dirección" error={errors.direccion?.message} span={2}>
            <input {...register('direccion')} className="form-input" />
          </Field>
        </div>
        <div className="card-footer">
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
              <X size={16} /> Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Save size={16} />}
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
