import { useRef } from 'react';
import { Paperclip, X, ExternalLink } from 'lucide-react';

/**
 * Stages a real `File` object for later multipart upload (via `POST
 * .../adjuntos`), unlike `ImageField` which encodes to base64 for the
 * legacy JSON-embedded image fields. `value` is either `null`, a `File`
 * (freshly picked, not yet uploaded), or an already-persisted attachment
 * object (`{ id, nombre, url }`) coming back from the backend.
 */
export const FileUploadField = ({ value, onChange, label, accept = 'image/*,.pdf' }) => {
  const inputRef = useRef(null);

  const isFile = value instanceof File;
  const isPersisted = value && !isFile;

  const handlePick = (file) => {
    if (file) onChange(file);
  };

  return (
    <div className="form-group" style={{ border: '1px dashed var(--gray-300)', borderRadius: 8, padding: 12 }}>
      {label && <label className="form-label">{label}</label>}
      {isFile ? (
        <div className="flex items-center gap-2">
          <Paperclip size={16} />
          <span style={{ fontSize: 13 }}>{value.name}</span>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => onChange(null)}>
            <X size={14} />
          </button>
        </div>
      ) : isPersisted ? (
        <div className="flex items-center gap-2">
          <Paperclip size={16} />
          <a href={value.url} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
            {value.nombre || 'Adjunto'} <ExternalLink size={12} />
          </a>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 13, marginBottom: 8 }}>
          <Paperclip size={20} style={{ margin: '0 auto 6px' }} />
          <div>Seleccioná un archivo para adjuntar</div>
        </div>
      )}
      {!isPersisted && (
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={e => handlePick(e.target.files?.[0])}
          style={{ marginTop: 8 }}
        />
      )}
    </div>
  );
};
