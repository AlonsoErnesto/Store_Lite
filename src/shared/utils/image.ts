/**
 * Optimizes an image file by resizing and compressing it using Canvas.
 */
export async function optimizeImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8,
): Promise<File> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  let { width, height } = img;

  // Calculate new dimensions
  if (width > height) {
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
  } else if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height);
    height = maxHeight;
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality),
  );

  if (!blob) {
    throw new Error('Canvas to Blob conversion failed');
  }

  return new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

export async function compressImageToMaxSize(
  file: File,
  maxBytes = 300 * 1024,
  outputType = file.type === 'image/png' ? 'image/webp' : 'image/jpeg',
): Promise<File> {
  if (file.size <= maxBytes) return file;

  const image = await loadImage(file);
  let width = image.width;
  let height = image.height;
  const qualities = [0.8, 0.7, 0.6, 0.5, 0.4, 0.3];
  let lastBlob: Blob | null = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const quality = qualities[Math.min(attempt, qualities.length - 1)];
    const blob = await renderImage(image, width, height, quality, outputType);
    lastBlob = blob;

    if (blob.size <= maxBytes) {
      const extension = outputType === 'image/webp' ? 'webp' : 'jpg';
      return new File([blob], file.name.replace(/\.[^/.]+$/, '') + `.${extension}`, {
        type: outputType,
        lastModified: Date.now(),
      });
    }

    width = Math.max(320, Math.round(width * 0.8));
    height = Math.max(320, Math.round(height * 0.8));
  }

  // Could not fit under maxBytes: return the smallest attempt so the server
  // rejects it with a clear message instead of failing the client silently.
  const fallbackBlob = lastBlob ?? new Blob([file], { type: outputType });
  const extension = outputType === 'image/webp' ? 'webp' : 'jpg';
  return new File([fallbackBlob], file.name.replace(/\.[^/.]+$/, '') + `.${extension}`, {
    type: outputType,
    lastModified: Date.now(),
  });
}

function renderImage(
  image: HTMLImageElement,
  width: number,
  height: number,
  quality: number,
  outputType: string,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return Promise.reject(new Error('Could not get canvas context'));
  }

  ctx.drawImage(image, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob conversion failed'));
      },
      outputType,
      quality,
    );
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
