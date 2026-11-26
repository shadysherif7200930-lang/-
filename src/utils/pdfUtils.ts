import type { PDFDocumentProxy } from 'pdfjs-dist';

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;

async function getPdfJs(): Promise<typeof import('pdfjs-dist')> {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
      return pdfjsLib;
    });
  }
  return pdfjsPromise;
}

export async function inspectPdfBuffer(
  arrayBuffer: ArrayBuffer
): Promise<{ pageCount: number; coverDataUrl: string }> {
  const pdfjsLib = await getPdfJs();
  const copy = arrayBuffer.slice(0);
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(copy) });
  const pdf = await loadingTask.promise;

  const page1 = await pdf.getPage(1);
  const viewport = page1.getViewport({ scale: 1.2 });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  const ctx = canvas.getContext('2d');
  if (ctx) {
    await page1.render({ canvasContext: ctx, viewport, canvas }).promise;
  }

  const coverDataUrl = canvas.toDataURL('image/jpeg', 0.86);
  const pageCount = pdf.numPages;
  await loadingTask.destroy();

  return { pageCount, coverDataUrl };
}

export async function loadPdfDocument(arrayBuffer: ArrayBuffer): Promise<PDFDocumentProxy> {
  const pdfjsLib = await getPdfJs();
  const copy = arrayBuffer.slice(0);
  return pdfjsLib.getDocument({ data: new Uint8Array(copy) }).promise;
}

export async function renderPdfPageToDataUrl(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  scale = 2.4
): Promise<string> {
  const safeScale = Math.min(4.2, Math.max(1.2, scale));
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: safeScale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  }

  return canvas.toDataURL('image/png');
}
