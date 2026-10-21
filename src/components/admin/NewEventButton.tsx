"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { createEventAction } from '@/app/admin/actions';
import { LogoPicker } from './LogoPicker';
import { TemplateDropzone, uploadImage } from './TemplateDropzone';

interface Props {
  className?: string;
  children?: React.ReactNode;
  /** False when a guest has used their free event; the button then leads to sign-up instead. */
  canCreate?: boolean;
  /** Pre-fills "Organized by" from the account profile. */
  defaultOrganizer?: string | null;
}

export function NewEventButton({ className = 'btn-primary', children, canCreate = true, defaultOrganizer }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [organizer, setOrganizer] = useState(defaultOrganizer ?? '');
  const [logo, setLogo] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !file) return;
    setBusy(true);
    try {
      const [templateUrl, logoUrl] = await Promise.all([uploadImage(file), logo ? uploadImage(logo, 'logos') : null]);
      await createEventAction({ name, templateUrl, logoUrl, organizer }); // redirects to the new event
    } catch (err) {
      if ((err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err;
      console.error(err);
      toast.error('Could not create the event. Check your Blob storage setup and try again.');
      setBusy(false);
    }
  };

  const content = children ?? (<><Plus className="h-4 w-4" /> New event</>);

  if (!canCreate) {
    return (
      <Link href="/signup?next=/admin" className={className} title="Guests can try one event. Sign up free to create more.">
        {content}
      </Link>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        {content}
      </button>
      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        size="xl"
        title="Create an event"
        description="Upload the certificate design. Next you'll place the name and add your participant list."
      >
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-5">
              <div>
                <label htmlFor="event-name" className="label">Event name</label>
                <input
                  id="event-name"
                  className="input"
                  placeholder="e.g. Web Development Bootcamp 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div>
                <label htmlFor="organizer" className="label">Organized by <span className="font-normal text-faint">(optional)</span></label>
                <input
                  id="organizer"
                  className="input"
                  placeholder="e.g. DevCon Philippines"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                />
              </div>
              <div>
                <span className="label">Organizer logo <span className="font-normal text-faint">(optional)</span></span>
                <LogoPicker file={logo} onChange={setLogo} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="label">Certificate template</span>
              <TemplateDropzone file={file} onChange={setFile} fill />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={busy || !name.trim() || !file}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? 'Uploading…' : 'Create event'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
