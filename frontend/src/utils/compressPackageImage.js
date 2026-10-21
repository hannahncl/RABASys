const MAX_DATA_URL_LENGTH = 60 * 1024;
const MAX_DIMENSION = 1280;
const MIN_DIMENSION = 240;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('The selected file could not be read as an image.'));
    };
    image.src = url;
  });
}

// Keeps a package image small enough for the current MySQL TEXT column.
export async function compressPackageImage(file) {
  if (!file?.type?.startsWith('image/')) {
    throw new Error('Please select a valid image file.');
  }

  const image = await loadImage(file);
  let scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));

  while (true) {
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (let quality = 0.86; quality >= 0.34; quality -= 0.08) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= MAX_DATA_URL_LENGTH) return dataUrl;
    }

    if (Math.min(width, height) <= MIN_DIMENSION) break;
    scale *= 0.72;
  }

  throw new Error('This image could not be compressed enough. Please use a smaller or simpler photo.');
}
