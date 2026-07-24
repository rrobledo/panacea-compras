const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

export const isImageName = (name) => IMAGE_EXTENSIONS.includes((name || '').split('.').pop()?.toLowerCase());

// The backend's adjunto list/detail responses (CompraAdjuntoRead, PagoAdjuntoRead)
// carry {id, nombre, tipo, fecha} but never a `url` — the download endpoint is a
// sibling GET route keyed by id, so the URL has to be built client-side instead.
export const adjuntoUrl = (parentPath, adjuntoId) => `${parentPath}/adjuntos/${adjuntoId}`;
