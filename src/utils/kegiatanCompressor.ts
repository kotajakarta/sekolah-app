import imageCompression from 'browser-image-compression';

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function processKegiatanFile(
  file: File,
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void
): Promise<File | null> {
  const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp)$/i.test(file.name);
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

  if (!isImage && !isPdf) {
    showToast('error', `File ${file.name} tidak valid. Hanya berkas PDF dan Gambar (JPG, PNG, WEBP) yang diperbolehkan.`);
    return null;
  }

  // Handle PDF files
  if (isPdf) {
    if (file.size > 1 * 1024 * 1024) {
      showToast('error', `Ukuran file PDF (${file.name}) bernilai ${formatFileSize(file.size)}, melebihi batas maksimal 1MB. Silakan gunakan PDF lebih kecil.`);
      return null;
    }
    return file;
  }

  // Handle Image files with auto compression
  if (isImage) {
    try {
      const options = {
        maxSizeMB: 0.9,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.8,
      };
      const compressedBlob = await imageCompression(file, options);
      if (compressedBlob.size > 1 * 1024 * 1024) {
        showToast('error', `Gambar (${file.name}) setelah dikompresi (${formatFileSize(compressedBlob.size)}) masih melebihi 1MB.`);
        return null;
      }
      const compressedFile = new File([compressedBlob], file.name, {
        type: compressedBlob.type || file.type,
        lastModified: Date.now(),
      });
      return compressedFile;
    } catch (err) {
      if (file.size > 1 * 1024 * 1024) {
        showToast('error', `Gagal mengompresi gambar (${file.name}) dan ukurannya melebihi 1MB.`);
        return null;
      }
      return file;
    }
  }

  return null;
}

export async function processMultipleKegiatanFiles(
  files: File[],
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void
): Promise<File[]> {
  const processedList: File[] = [];
  for (const file of files) {
    const result = await processKegiatanFile(file, showToast);
    if (result) {
      processedList.push(result);
    }
  }
  return processedList;
}
