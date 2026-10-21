"use client";

import { useEffect, useMemo, useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { ACCEPTED } from './TemplateDropzone';

const MAX_BYTES = 5 * 1024 * 1024;

interface Props {
  /** A newly picked file (not yet uploaded). */
  file: File | null;
  /** The logo already saved for the event, if any. */
  currentUrl?: string | null;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
}

/** Small square picker for the organizer's logo shown on the claim page. */
export function LogoPicker({ file, currentUrl, onChange, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const shown = previewUrl ?? currentUrl;

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) return void toast.error('Use a PNG, JPG or WebP logo.');
    if (f.size > MAX_BYTES) return void toast.error('Logos must be under 5 MB.');
    onChange(f);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-line-strong bg-surface transition-colors hover:border-accent hover:bg-accent-soft/50"
        aria-label="Choose logo"
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="Logo" className="h-full w-full object-contain p-1.5" />
        ) : (
          <ImagePlus className="h-5 w-5 text-faint" />
        )}
      </button>
      <div className="min-w-0 text-xs text-muted">
        <button type="button" onClick={() => inputRef.current?.click()} className="font-semibold text-accent hover:underline">
          {shown ? 'Change logo' : 'Upload logo'}
        </button>
        {shown && (onRemove || file) && (
          <button
            type="button"
            onClick={() => (file ? onChange(null) : onRemove?.())}
            className="ml-3 inline-flex items-center gap-0.5 font-semibold hover:text-danger"
          >
            <X className="h-3 w-3" /> Remove
          </button>
        )}
        <p className="mt-0.5">Square PNG with a transparent background works best.</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="hidden"
        onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }}
      />
    </div>
  );
}
