const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

export const isImageName = (name) => IMAGE_EXTENSIONS.includes((name || '').split('.').pop()?.toLowerCase());
