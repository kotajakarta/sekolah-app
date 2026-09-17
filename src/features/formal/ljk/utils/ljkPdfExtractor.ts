import * as pdfjsLib from 'pdfjs-dist';
// Menggunakan Vite ?url import agar asset worker terbundel secara offline tanpa ketergantungan CDN
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Inisialisasi worker sekali saat modul dimuat
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
}

export interface LjkExtractedPage {
  pageNumber: number;
  totalNumber: number;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

/**
 * Membaca berkas PDF LJK dan mengekstrak setiap halaman menjadi berkas gambar JPEG
 * dengan resolusi tinggi (scale 2.0) yang siap diproses oleh OMR engine.
 */
export async function extractLjkPdfPages(
  pdfFile: File,
  onPageExtracted?: (page: LjkExtractedPage, index: number, total: number) => void
): Promise<LjkExtractedPage[]> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.0.0/cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;
  const pages: LjkExtractedPage[] = [];

  const baseFileName = pdfFile.name.replace(/\.[^/.]+$/, '');

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    // Skala 2.0 menghasilkan ~1600x2300 piksel dari kertas A4, sangat tajam untuk OMR
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error(`Gagal membuat konteks 2D canvas untuk halaman ${pageNum}`);
    }

    // Render halaman PDF ke canvas
    await page.render({
      canvasContext: ctx,
      canvas,
      viewport,
    }).promise;

    // Ekstrak canvas ke Blob JPEG berkualitas tinggi (0.92)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error(`Gagal mengonversi halaman ${pageNum} ke blob gambar.`));
        },
        'image/jpeg',
        0.92
      );
    });

    const pageFileName = `${baseFileName}_hal_${pageNum}.jpg`;
    const imageFile = new File([blob], pageFileName, { type: 'image/jpeg' });
    const previewUrl = URL.createObjectURL(blob);

    const extractedPage: LjkExtractedPage = {
      pageNumber: pageNum,
      totalNumber: totalPages,
      file: imageFile,
      previewUrl,
      width: canvas.width,
      height: canvas.height,
    };

    pages.push(extractedPage);
    if (onPageExtracted) {
      onPageExtracted(extractedPage, pageNum - 1, totalPages);
    }
  }

  return pages;
}
