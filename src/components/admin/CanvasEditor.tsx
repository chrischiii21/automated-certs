"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlignCenterHorizontal, Loader2, MoveHorizontal, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { saveLayoutAction, suggestStyleAction } from '@/app/admin/actions';
import { CERTIFICATE_FONTS, drawCertificate, fittedFontSize, loadFont, loadImage, suggestColors } from '@/lib/certificate';
import type { NameLayout } from '@/lib/types';

interface Props {
  eventId: string;
  templateUrl: string;
  initialLayout: NameLayout;
  participantNames: string[];
  aiEnabled: boolean;
  isGuest: boolean;
}

const SNAP = 1.2; // % distance at which the name snaps to the horizontal center

export function CanvasEditor({ eventId, templateUrl, initialLayout, participantNames, aiEnabled, isGuest }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragOffset = useRef<{ dx: number; dy: number } | null>(null);
  // Keyed by URL so a replaced template shows the loader until the new image arrives.
  const [loaded, setLoaded] = useState<{ url: string; img: HTMLImageElement | null } | null>(null);
  const img = loaded?.url === templateUrl ? loaded.img : null;
  const imgError = loaded?.url === templateUrl && !loaded.img;
  const [layout, setLayout] = useState(initialLayout);
  const [saved, setSaved] = useState(initialLayout);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fontTick, setFontTick] = useState(0);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestionReason, setSuggestionReason] = useState<string | null>(null);

  const longestName = useMemo(
    () => participantNames.reduce((a, b) => (b.length > a.length ? b : a), ''),
    [participantNames],
  );
  const [previewText, setPreviewText] = useState(longestName || 'Maria Clara de los Santos');

  const dirty = JSON.stringify(layout) !== JSON.stringify(saved);
  const font = CERTIFICATE_FONTS.find((f) => f.family === layout.fontFamily) ?? CERTIFICATE_FONTS[0];
  const update = (patch: Partial<NameLayout>) => setLayout((l) => ({ ...l, ...patch }));

  useEffect(() => {
    loadImage(templateUrl).then(
      (i) => setLoaded({ url: templateUrl, img: i }),
      () => setLoaded({ url: templateUrl, img: null }),
    );
  }, [templateUrl]);

  useEffect(() => {
    loadFont(layout.fontFamily, layout.fontWeight).then(() => setFontTick((t) => t + 1));
  }, [layout.fontFamily, layout.fontWeight]);

  useEffect(() => {
    if (img && canvasRef.current) drawCertificate(canvasRef.current, img, layout, previewText, { guides: true });
  }, [img, layout, previewText, fontTick]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const toPercent = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toPercent(e);
    const halfW = layout.maxWidth / 2;
    const halfH = ((layout.fontSize * 0.7) / img.naturalHeight) * 100;
    const insideBox = Math.abs(p.x - layout.x) <= halfW && Math.abs(p.y - layout.y) <= halfH;
    // Grabbing the name keeps the grab point; clicking elsewhere moves the name there.
    dragOffset.current = insideBox ? { dx: p.x - layout.x, dy: p.y - layout.y } : { dx: 0, dy: 0 };
    setDragging(true);
    if (!insideBox) moveTo(p.x, p.y);
  };

  const moveTo = useCallback((px: number, py: number) => {
    let x = Math.min(100, Math.max(0, px));
    const y = Math.min(100, Math.max(0, py));
    if (Math.abs(x - 50) < SNAP) x = 50;
    setLayout((l) => ({ ...l, x, y }));
  }, []);

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !dragOffset.current) return;
    const p = toPercent(e);
    moveTo(p.x - dragOffset.current.dx, p.y - dragOffset.current.dy);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 1 : 0.2;
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!delta) return;
    e.preventDefault();
    setLayout((l) => ({ ...l, x: Math.min(100, Math.max(0, l.x + delta[0])), y: Math.min(100, Math.max(0, l.y + delta[1])) }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveLayoutAction(eventId, layout);
      setSaved(layout);
      toast.success('Design saved');
    } catch {
      toast.error('Could not save the design');
    } finally {
      setSaving(false);
    }
  };

  // Tell the organizer when the preview name is being shrunk to fit.
  const shrunkTo = useMemo(() => {
    if (!img || !previewText) return null;
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return null;
    const size = fittedFontSize(ctx, layout, previewText, img.naturalWidth);
    return size < layout.fontSize ? size : null;
    // fontTick: re-measure once the font has loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, layout, previewText, fontTick]);

  // Colors sampled from the design, readable where the name sits.
  // Rounded so dragging doesn't re-sample the image on every pixel of movement.
  const boxX = Math.round(layout.x);
  const boxY = Math.round(layout.y);
  const boxWidth = Math.round(layout.maxWidth);
  const palette = useMemo(
    () => (img ? suggestColors(img, { x: boxX, y: boxY, maxWidth: boxWidth }) : []),
    [img, boxX, boxY, boxWidth],
  );

  const suggest = async () => {
    if (!img) return;
    setSuggesting(true);
    try {
      const result = await suggestStyleAction(eventId, { width: img.naturalWidth, height: img.naturalHeight }, previewText);
      setLayout(result.layout);
      setSuggestionReason(result.reason);
      toast.success('Suggestion applied. Save the design to keep it.');
    } catch {
      toast.error('Could not get a suggestion. Try again in a moment.');
    } finally {
      setSuggesting(false);
    }
  };

  const maxFontSize = img ? Math.max(120, Math.round(img.naturalWidth / 6)) : 300;

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
      {/* Stays on screen while the controls scroll, so changes are always visible. */}
      <div className="lg:sticky lg:top-20 lg:col-span-8">
        <div className="card overflow-hidden">
          <div className="flex min-h-60 items-center justify-center bg-[repeating-conic-gradient(var(--color-sunken)_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] p-3">
            {imgError ? (
              <p className="text-sm text-danger">The template image could not be loaded.</p>
            ) : !img ? (
              <Loader2 className="h-6 w-6 animate-spin text-faint" />
            ) : null}
            <canvas
              ref={canvasRef}
              tabIndex={0}
              aria-label="Certificate preview. Drag the name, or use the arrow keys, to position it."
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={() => setDragging(false)}
              onPointerCancel={() => setDragging(false)}
              onKeyDown={onKeyDown}
              className={cn(
                'h-auto max-h-[70vh] w-auto max-w-full touch-none rounded-md shadow-pop outline-none focus-visible:ring-4 focus-visible:ring-accent/30 lg:max-h-[calc(100vh-10rem)]',
                !img && 'hidden',
                dragging ? 'cursor-grabbing' : 'cursor-grab',
              )}
            />
          </div>
          <p className="border-t px-4 py-2 text-xs text-muted">
            Drag the name (or click to move it there). Arrow keys nudge, Shift for bigger steps. Names longer than the dashed box shrink to fit.
          </p>
        </div>
      </div>

      <aside className="card divide-y overflow-hidden lg:sticky lg:top-20 lg:col-span-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center gap-2 bg-surface/95 px-4 py-3 backdrop-blur">
          <h3 className="mr-auto text-sm font-bold">Name style</h3>
          {dirty && (
            <button className="btn-ghost btn-sm" onClick={() => setLayout(saved)} disabled={saving}>Discard</button>
          )}
          <button className="btn-primary btn-sm" onClick={save} disabled={!dirty || saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {dirty ? 'Save' : 'Saved'}
          </button>
        </div>

        <section className="space-y-2 bg-gradient-to-b from-accent-soft/60 to-surface p-4">
          {isGuest ? (
            <Link href={`/signup?next=${encodeURIComponent(`/admin/events/${eventId}?tab=design`)}`} className="btn-secondary btn-sm w-full">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Sign up free to use Auto-style
            </Link>
          ) : aiEnabled ? (
            <button className="btn-primary btn-sm w-full" onClick={suggest} disabled={suggesting || !img}>
              {suggesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {suggesting ? 'Studying your design…' : 'Auto-style: suggest font, color & position'}
            </button>
          ) : (
            <p className="flex gap-1.5 text-xs text-muted">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span>Add a free <code className="text-ink">GROQ_API_KEY</code> to let AI pick the font, color and position.</span>
            </p>
          )}
          {suggestionReason && <p className="text-xs italic text-muted">“{suggestionReason}”</p>}
        </section>

        <section className="space-y-2 p-4">
          <label className="label mb-0" htmlFor="preview-name">Preview name</label>
          <input id="preview-name" className="input h-9" value={previewText} onChange={(e) => setPreviewText(e.target.value)} placeholder="Type a name" />
          {longestName && longestName !== previewText && (
            <button className="text-xs font-semibold text-accent hover:underline" onClick={() => setPreviewText(longestName)}>
              Try the longest name on your list
            </button>
          )}
          {shrunkTo && <p className="text-xs text-warning">Shrunk to {shrunkTo}px to fit the max width.</p>}
        </section>

        <section className="space-y-3 p-4">
          <div>
            <label className="label" htmlFor="font">Font</label>
            <div className="flex gap-2">
              <select
                id="font"
                className="input h-9 min-w-0 flex-1"
                value={layout.fontFamily}
                onChange={(e) => {
                  const next = CERTIFICATE_FONTS.find((f) => f.family === e.target.value)!;
                  update({ fontFamily: next.family, fontWeight: next.weights.includes(layout.fontWeight) ? layout.fontWeight : next.weights.at(-1)! });
                }}
              >
                {CERTIFICATE_FONTS.map((f) => <option key={f.family} value={f.family}>{f.label} — {f.style}</option>)}
              </select>
              {font.weights.length > 1 && (
                <button
                  onClick={() => update({ fontWeight: layout.fontWeight >= 700 ? 400 : 700 })}
                  aria-pressed={layout.fontWeight >= 700}
                  title="Bold"
                  className={cn(
                    'h-9 w-9 shrink-0 rounded-lg border text-sm font-bold transition-colors',
                    layout.fontWeight >= 700 ? 'border-accent bg-accent-soft text-accent' : 'border-line-strong text-muted hover:text-ink',
                  )}
                >
                  B
                </button>
              )}
            </div>
          </div>

          <Slider id="size" label="Size" value={Math.min(layout.fontSize, maxFontSize)} min={12} max={maxFontSize} suffix="px" onChange={(v) => update({ fontSize: v })} />
          <Slider
            id="width"
            label={<><MoveHorizontal className="h-3.5 w-3.5" /> Max width</>}
            value={Math.round(layout.maxWidth)}
            min={10}
            max={100}
            suffix="%"
            onChange={(v) => update({ maxWidth: v })}
          />
        </section>

        <section className="space-y-2 p-4">
          <label className="label mb-0" htmlFor="color">Color</label>
          <div className="flex items-center gap-2">
            <input
              id="color"
              type="color"
              value={layout.color}
              onChange={(e) => update({ color: e.target.value })}
              className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border border-line-strong bg-surface p-0.5"
            />
            <input
              className="input h-9 w-28 font-mono text-xs uppercase"
              value={layout.color}
              maxLength={7}
              onChange={(e) => update({ color: e.target.value })}
              aria-label="Hex color"
            />
          </div>
          {palette.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="mr-1 text-xs text-muted">From your design:</span>
              {palette.map((c) => (
                <button
                  key={c}
                  onClick={() => update({ color: c })}
                  title={c}
                  aria-label={`Use color ${c}`}
                  className={cn(
                    'h-6 w-6 rounded-full border-2 shadow-card transition-transform hover:scale-110',
                    layout.color.toLowerCase() === c ? 'border-accent ring-2 ring-accent/30' : 'border-surface',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </section>

        <section className="flex items-center justify-between gap-2 p-4">
          <span className="text-xs tabular-nums text-muted">X {layout.x.toFixed(1)}% · Y {layout.y.toFixed(1)}%</span>
          <button className="btn-secondary btn-sm" onClick={() => update({ x: 50 })} disabled={layout.x === 50}>
            <AlignCenterHorizontal className="h-3.5 w-3.5" />
            Center
          </button>
        </section>
      </aside>
    </div>
  );
}

function Slider({ id, label, value, min, max, suffix, onChange }: {
  id: string;
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="label mb-0 flex items-center gap-1.5" htmlFor={id}>{label}</label>
        <span className="text-xs tabular-nums text-muted">{value}{suffix}</span>
      </div>
      <input id={id} type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-accent" />
    </div>
  );
}
