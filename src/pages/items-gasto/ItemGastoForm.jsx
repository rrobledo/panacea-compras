import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X } from 'lucide-react';
import { Field } from '../../components/ui';

const schema = z.object({
  codigo: z.string().optional(),
  nombre: z.string().min(1, 'Ingrese el nombre'),
  activo: z.union([z.boolean(), z.string()]).transform(v => v === true || v === 'true'),
});

export const ItemGastoForm = ({ initialData, onSubmit, onCancel, saving }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { codigo: '', nombre: '', activo: true, ...initialData },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="card">
        <div className="card-header"><h3 className="card-title">Información del Ítem de Gasto</h3></div>
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
            <input {...register('nombre')} className={`form-input ${errors.nombre ? 'error' : ''}`} placeholder="Nombre del ítem de gasto" />
          </Field>
          <Field label="Activo" size="sm">
            <select {...register('activo')} className="form-select">
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
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
