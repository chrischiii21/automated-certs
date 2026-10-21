import { drawCertificate, loadFont, loadImage } from './certificate';
import type { NameLayout } from './types';

export type BulkFormat = 'zip' | 'pdf';

/** Certificates per downloaded file; keeps browser memory in check for big lists. */
export const BULK_PART_SIZE = 200;

interface BulkOptions {
  eventName: string;
  templateUrl: string;
  layout: NameLayout;
  names: string[];
  format: BulkFormat;
  onProgress: (done: number, total: number) => void;
  signal: AbortSignal;
}

// Also drop trailing dots ("Jr." would otherwise become "Jr..png"; Windows strips them anyway).
const safeFileName = (s: string) => s.replace(/[\\/:*?"<>|]+/g, '').trim().replace(/\.+$/, '') || 'certificate';

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not render certificate'))), type, quality),
  );
}

function save(blob: Blob, fileName: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/**
 * Renders a certificate for every name in the browser and downloads them as
 * ZIP files of PNGs or as print-ready PDFs (one page per participant).
 */
export async function generateCertificates({ eventName, templateUrl, layout, names, format, onProgress, signal }: BulkOptions) {
  const [img] = await Promise.all([loadImage(templateUrl), loadFont(layout.fontFamily, layout.fontWeight)]);
  const canvas = document.createElement('canvas');
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const pad = String(names.length).length;
  const parts = Math.ceil(names.length / BULK_PART_SIZE);
  let done = 0;

  for (let part = 0; part < parts; part++) {
    const chunk = names.slice(part * BULK_PART_SIZE, (part + 1) * BULK_PART_SIZE);
    const suffix = parts > 1 ? ` (part ${part + 1} of ${parts})` : '';

    if (format === 'zip') {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      for (const [i, name] of chunk.entries()) {
        if (signal.aborted) return;
        drawCertificate(canvas, img, layout, name);
        const n = String(part * BULK_PART_SIZE + i + 1).padStart(pad, '0');
        zip.file(`${n} - ${safeFileName(name)}.png`, await canvasToBlob(canvas, 'image/png'));
        onProgress(++done, names.length);
      }
      save(await zip.generateAsync({ type: 'blob' }), `${safeFileName(eventName)} certificates${suffix}.zip`);
    } else {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: width >= height ? 'landscape' : 'portrait', unit: 'px', format: [width, height], hotfixes: ['px_scaling'] });
      for (const [i, name] of chunk.entries()) {
        if (signal.aborted) return;
        drawCertificate(canvas, img, layout, name);
        if (i > 0) pdf.addPage([width, height], width >= height ? 'landscape' : 'portrait');
        const jpeg = new Uint8Array(await (await canvasToBlob(canvas, 'image/jpeg', 0.92)).arrayBuffer());
        pdf.addImage(jpeg, 'JPEG', 0, 0, width, height, undefined, 'FAST');
        onProgress(++done, names.length);
      }
      save(pdf.output('blob'), `${safeFileName(eventName)} certificates${suffix}.pdf`);
    }
  }
}
