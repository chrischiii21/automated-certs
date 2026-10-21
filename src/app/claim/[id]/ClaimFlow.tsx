"use client";

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Award, CircleAlert, Download, Loader2, PartyPopper, RotateCcw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { drawCertificate, drawWatermark, loadFont, loadImage } from '@/lib/certificate';
import type { PublicEvent } from '@/lib/types';
import { claimCertificate } from './actions';

type Stage =
  | { kind: 'form' }
  | { kind: 'verifying' }
  | { kind: 'not_found'; tried: string }
  | { kind: 'ready'; name: string };

const PLACEHOLDER_NAME = 'Your Name';

export function ClaimFlow({ event }: { event: PublicEvent }) {
  const [input, setInput] = useState('');
  const [stage, setStage] = useState<Stage>({ kind: 'form' });
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [fontReady, setFontReady] = useState(false);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    loadImage(event.templateUrl).then(setImg, () => toast.error('The certificate template could not be loaded.'));
    loadFont(event.layout.fontFamily, event.layout.fontWeight).then(() => setFontReady(true));
  }, [event.templateUrl, event.layout.fontFamily, event.layout.fontWeight]);

  const verified = stage.kind === 'ready';
  const previewName = verified ? stage.name : input.trim() || PLACEHOLDER_NAME;

  // Live preview: redraw on every keystroke. Until the name is verified the
  // preview carries a watermark and can't be downloaded.
  useEffect(() => {
    if (!canvas || !img) return;
    drawCertificate(canvas, img, event.layout, previewName);
    if (!verified) drawWatermark(canvas);
  }, [canvas, img, fontReady, event.layout, previewName, verified]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tried = input.trim();
    if (tried.length < 2) return;
    setStage({ kind: 'verifying' });
    try {
      const result = await claimCertificate(event.id, tried);
      if (result.ok) setStage({ kind: 'ready', name: result.name });
      else if (result.reason === 'not_found') setStage({ kind: 'not_found', tried });
      else {
        toast.error(result.reason === 'not_open' ? 'Claiming for this event is no longer open.' : 'Please enter your full name.');
        setStage({ kind: 'form' });
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
      setStage({ kind: 'form' });
    }
  };

  const download = () => {
    if (!canvas || stage.kind !== 'ready') return;
    canvas.toBlob((blob) => {
      if (!blob) return toast.error('Could not create the image. Please try again.');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${event.name} - ${stage.name}.png`.replace(/[\\/:*?"<>|]+/g, '');
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, 'image/png');
  };

  const reset = () => {
    setStage({ kind: 'form' });
    setInput('');
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--color-surface),transparent_60%)]">
      <div
        className="mx-auto grid max-w-6xl gap-6 px-4 py-8 [grid-template-areas:'header'_'preview'_'form'] sm:px-6 sm:py-12
          lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-x-14 lg:gap-y-8 lg:py-20
          lg:[grid-template-areas:'header_preview'_'form_preview']"
      >
        <EventHeader event={event} />

        <section className="[grid-area:preview]">
          <div className="relative overflow-hidden rounded-2xl border bg-surface p-1.5 shadow-pop sm:p-2">
            <canvas ref={setCanvas} className="block h-auto w-full rounded-xl" />
            {!img && (
              <div className="flex aspect-[1.414/1] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-faint" />
              </div>
            )}
          </div>
          <p className="mt-2.5 text-center text-xs text-muted">
            {verified ? (
              <span className="inline-flex items-center gap-1 font-semibold text-success">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified certificate
              </span>
            ) : (
              'Live preview: your name appears as you type'
            )}
          </p>
        </section>

        <section className="[grid-area:form] lg:self-start">
          <AnimatePresence mode="wait" initial={false}>
            {stage.kind !== 'ready' ? (
              <motion.form
                key="form"
                onSubmit={submit}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="card space-y-4 p-5 sm:p-6"
              >
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold">Your full name</label>
                  <p className="mt-0.5 text-xs text-muted">Enter it the way you registered for the event.</p>
                </div>
                <input
                  id="name"
                  className="input h-12 text-base"
                  placeholder="e.g. Juan Dela Cruz"
                  autoComplete="name"
                  value={input}
                  maxLength={120}
                  onChange={(e) => { setInput(e.target.value); if (stage.kind === 'not_found') setStage({ kind: 'form' }); }}
                  disabled={stage.kind === 'verifying'}
                />
                {stage.kind === 'not_found' && (
                  <div role="alert" className="flex gap-2.5 rounded-xl bg-danger-soft p-3 text-sm text-danger">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-semibold">&ldquo;{stage.tried}&rdquo; isn&apos;t on the participant list.</p>
                      <p className="mt-1 text-danger/80">
                        Check the spelling, or try your full registered name with or without a middle name. Still stuck? Contact
                        {event.organizer ? ` ${event.organizer}` : ' the organizer'}.
                      </p>
                    </div>
                  </div>
                )}
                <button className="btn-primary h-12 w-full text-base" disabled={stage.kind === 'verifying' || input.trim().length < 2}>
                  {stage.kind === 'verifying' ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Checking the list…</>
                  ) : (
                    <>Get my certificate <ArrowRight className="h-5 w-5" /></>
                  )}
                </button>
                <p className="flex items-start gap-1.5 text-xs text-muted">
                  <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-success" />
                  Certificates are only issued to registered participants on the organizer&apos;s list.
                </p>
              </motion.form>
            ) : (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card space-y-4 p-5 sm:p-6"
              >
                <div>
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-success">
                    <PartyPopper className="h-4 w-4" /> You&apos;re on the list
                  </p>
                  <h2 className="mt-1.5 font-display text-2xl font-semibold leading-snug">Congratulations, {stage.name}!</h2>
                  <p className="mt-1 text-sm text-muted">Your certificate is ready.</p>
                </div>
                <button className="btn-primary h-12 w-full text-base" onClick={download} disabled={!img}>
                  <Download className="h-5 w-5" />
                  Download certificate (PNG)
                </button>
                <button className="btn-ghost w-full" onClick={reset}>
                  <RotateCcw className="h-4 w-4" />
                  Not you? Start over
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}

export function EventHeader({ event, centered }: { event: Pick<PublicEvent, 'name' | 'logoUrl' | 'organizer'>; centered?: boolean }) {
  return (
    <header className={centered ? 'text-center' : 'text-center [grid-area:header] lg:self-end lg:text-left'}>
      <div className={centered ? 'flex flex-col items-center gap-3' : 'flex flex-col items-center gap-3 lg:flex-row lg:items-center'}>
        {event.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.logoUrl} alt={event.organizer ?? 'Organizer logo'} className="h-14 w-auto max-w-40 rounded-xl bg-surface object-contain p-1.5 shadow-card" />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-accent shadow-card">
            <Award className="h-6 w-6" />
          </span>
        )}
        <div>
          {event.organizer && <p className="text-sm font-semibold text-ink">{event.organizer}</p>}
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Official certificate</p>
        </div>
      </div>
      <h1 className="mt-5 font-display text-3xl font-semibold leading-[1.1] tracking-tight text-balance sm:text-4xl lg:text-5xl">{event.name}</h1>
    </header>
  );
}
