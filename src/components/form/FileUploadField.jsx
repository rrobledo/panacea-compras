import { useRef, useMemo, useEffect } from 'react';
import { Paperclip, X, ExternalLink } from 'lucide-react';
import { isImageName } from '../../utils/attachments';

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

  // Local object URL so a just-pasted/picked image previews the same way a
  // persisted adjunto does in CompraDetailModal, before it's ever uploaded.
  const filePreviewUrl = useMemo(() => (
    isFile && value.type.startsWith('image/') ? URL.createObjectURL(value) : null
  ), [isFile, value]);
  useEffect(() => () => { if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl); }, [filePreviewUrl]);

  const handlePick = (file) => {
    if (file) onChange(file);
  };

  const handlePaste = (e) => {
    if (isPersisted) return;
    const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'));
    if (!item) return;
    e.preventDefault();
    const file = item.getAsFile();
    if (!file) return;
    // Clipboard images come in as "image.png" with no useful name; give them a timestamped one.
    const named = new File([file], `pegado-${Date.now()}.${file.type.split('/')[1] || 'png'}`, { type: file.type });
    handlePick(named);
  };

  return (
    <div
      className="form-group"
      style={{ border: '1px dashed var(--gray-300)', borderRadius: 8, padding: 12 }}
      onPaste={handlePaste}
      tabIndex={isPersisted ? undefined : 0}
    >
      {label && <label className="form-label">{label}</label>}
      {isFile ? (
        filePreviewUrl ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={filePreviewUrl} alt={value.name} style={{ maxWidth: 160, maxHeight: 160, borderRadius: 6, display: 'block' }} />
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              style={{ position: 'absolute', top: 4, right: 4 }}
              onClick={() => onChange(null)}
            >
              <X size={14} />
            </button>
            <div style={{ fontSize: 12, marginTop: 4, color: 'var(--gray-500)' }}>{value.name}</div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Paperclip size={16} />
            <span style={{ fontSize: 13 }}>{value.name}</span>
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => onChange(null)}>
              <X size={14} />
            </button>
          </div>
        )
      ) : isPersisted ? (
        <a
          href={value.url}
          target="_blank"
          rel="noreferrer"
          style={{ display: 'block', width: 'fit-content', textDecoration: 'none' }}
        >
          {isImageName(value.nombre || value.url) ? (
            <img src={value.url} alt={value.nombre || 'Adjunto'} style={{ maxWidth: 160, maxHeight: 160, borderRadius: 6, display: 'block' }} />
          ) : (
            <div className="flex items-center gap-2">
              <Paperclip size={16} />
              <span style={{ fontSize: 13 }}>{value.nombre || 'Adjunto'}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, marginTop: 4, color: 'var(--gray-500)' }}>
            <span>{value.nombre || 'Adjunto'}</span>
            <ExternalLink size={12} />
          </div>
        </a>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 13, marginBottom: 8 }}>
          <Paperclip size={20} style={{ margin: '0 auto 6px' }} />
          <div>Seleccioná un archivo o pegá una imagen (Ctrl+V)</div>
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
