import * as pdfjsLib from 'pdfjs-dist';
// Vite ?url import untuk bundel worker secara offline tanpa CDN
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
}

export interface LjkExtractedPage {
  /** Nomor halaman PDF asli (1-based) */
  pageNumber: number;
  /** Total halaman PDF */
  totalNumber: number;
  /** Index dalam output array (0-based, termasuk split) */
  splitIndex: 0 | 1;
  /** Sisi: 'full' | 'left' | 'right' */
  splitSide: 'full' | 'left' | 'right';
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

/**
 * Membaca berkas PDF LJK dan mengekstrak setiap halaman menjadi berkas JPEG
 * dengan resolusi tinggi (scale 2.0) yang siap diproses OMR engine.
 *
 * @param pdfFile           Berkas PDF input
 * @param onPageExtracted   Callback progres per halaman/belahan
 * @param options
 *   .splitLandscape        Jika true: halaman landscape (lebar > tinggi) dipotong
 *                          kiri-kanan menjadi 2 gambar A5 portrait. Default: false.
 */
export async function extractLjkPdfPages(
  pdfFile: File,
  onPageExtracted?: (page: LjkExtractedPage, index: number, total: number) => void,
  options?: { splitLandscape?: boolean }
): Promise<LjkExtractedPage[]> {
  const splitLandscape = options?.splitLandscape ?? false;

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
  // Estimasi total output untuk progress (tidak tahu apakah landscape sebelum render)
  const estimatedTotal = splitLandscape ? totalPages * 2 : totalPages;
  let outputIndex = 0;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    // scale 2.0 → A4 landscape ≈ 1684×1190px, A4 portrait ≈ 1190×1684px
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error(`Gagal membuat konteks canvas untuk halaman ${pageNum}`);
    }

    await page.render({ canvasContext: ctx, canvas, viewport }).promise;

    const isLandscape = canvas.width > canvas.height;

    if (splitLandscape && isLandscape) {
      // Split landscape A4 menjadi 2 A5 (kiri & kanan)
      const halfW = Math.floor(canvas.width / 2);
      const fullH = canvas.height;

      for (const side of ['left', 'right'] as const) {
        const srcX = side === 'left' ? 0 : halfW;
        const halfCanvas = document.createElement('canvas');
        halfCanvas.width = halfW;
        halfCanvas.height = fullH;
        const halfCtx = halfCanvas.getContext('2d')!;
        halfCtx.drawImage(canvas, srcX, 0, halfW, fullH, 0, 0, halfW, fullH);

        const blob = await canvasToBlob(halfCanvas, pageNum, side);
        const suffix = side === 'left' ? 'L' : 'R';
        const imageFile = new File(
          [blob],
          `${baseFileName}_hal_${pageNum}${suffix}.jpg`,
          { type: 'image/jpeg' }
        );
        const previewUrl = URL.createObjectURL(blob);

        const extractedPage: LjkExtractedPage = {
          pageNumber: pageNum,
          totalNumber: totalPages,
          splitIndex: side === 'left' ? 0 : 1,
          splitSide: side,
          file: imageFile,
          previewUrl,
          width: halfW,
          height: fullH,
        };

        pages.push(extractedPage);
        if (onPageExtracted) onPageExtracted(extractedPage, outputIndex, estimatedTotal);
        outputIndex++;
      }
    } else {
      // Mode normal: satu halaman = satu gambar
      const blob = await canvasToBlob(canvas, pageNum, 'full');
      const imageFile = new File(
        [blob],
        `${baseFileName}_hal_${pageNum}.jpg`,
        { type: 'image/jpeg' }
      );
      const previewUrl = URL.createObjectURL(blob);

      const extractedPage: LjkExtractedPage = {
        pageNumber: pageNum,
        totalNumber: totalPages,
        splitIndex: 0,
        splitSide: 'full',
        file: imageFile,
        previewUrl,
        width: canvas.width,
        height: canvas.height,
      };

      pages.push(extractedPage);
      if (onPageExtracted) onPageExtracted(extractedPage, outputIndex, estimatedTotal);
      outputIndex++;
    }
  }

  return pages;
}

/** Konversi canvas ke JPEG Blob kualitas tinggi (0.92) */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  pageNum: number,
  side: string
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error(`Gagal mengonversi hal. ${pageNum} sisi ${side} ke blob.`));
      },
      'image/jpeg',
      0.92
    );
  });
}
