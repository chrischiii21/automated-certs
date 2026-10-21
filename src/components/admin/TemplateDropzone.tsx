"use client";

import { useEffect, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { ImageUp, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 20 * 1024 * 1024;
const MIN_PRINT_WIDTH = 1600;

/** Uploads an image straight from the browser to Vercel Blob. */
export async function uploadImage(file: File, folder: 'templates' | 'logos' = 'templates'): Promise<string> {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
  const blob = await upload(`${folder}/${safeName}`, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
  });
  return blob.url;
}

/** `fill` stretches the drop area to the height of its container (used in the two-column create form). */
export function TemplateDropzone({ file, onChange, fill }: { file: File | null; onChange: (file: File | null) => void; fill?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState<{ file: File; url: string; width: number; height: number } | null>(null);
  const preview = file && loaded?.file === file ? loaded : null;
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setLoaded({ file, url, width: img.naturalWidth, height: img.naturalHeight });
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) return setError('Use a PNG, JPG or WebP image.');
    if (f.size > MAX_BYTES) return setError('That image is larger than 20 MB.');
    setError(null);
    onChange(f);
  };

  return (
    <div className={cn(fill && 'flex flex-1 flex-col')}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed p-4 text-center transition-colors',
          fill && 'flex-1',
          dragging ? 'border-accent bg-accent-soft' : 'border-line-strong hover:border-accent hover:bg-accent-soft/50',
          preview ? 'min-h-0' : 'min-h-44',
        )}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.url} alt="Template preview" className="max-h-52 w-auto rounded-lg shadow-card" />
            <span className="text-xs text-muted">
              {file?.name} · {preview.width}×{preview.height}px · <span className="font-semibold text-accent">Change</span>
            </span>
          </>
        ) : (
          <>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
              <ImageUp className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold">Drop your certificate design here, or click to browse</span>
            <span className="text-xs text-muted">PNG, JPG or WebP · up to 20 MB · leave a blank space for the name</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="hidden"
        onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }}
      />
      {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
      {preview && preview.width < MIN_PRINT_WIDTH && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-warning">
          <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
          This image is only {preview.width}px wide, so certificates may look blurry when printed. {MIN_PRINT_WIDTH}px or more is recommended.
        </p>
      )}
    </div>
  );
}
