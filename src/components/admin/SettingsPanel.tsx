"use client";

import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { deleteEventAction, renameEventAction, replaceTemplateAction, updateBrandingAction } from '@/app/admin/actions';
import type { CertEvent } from '@/lib/types';
import { LogoPicker } from './LogoPicker';
import { TemplateDropzone, uploadImage } from './TemplateDropzone';

export function SettingsPanel({ event }: { event: CertEvent }) {
  const [name, setName] = useState(event.name);
  const [renaming, setRenaming] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const rename = async (e: React.FormEvent) => {
    e.preventDefault();
    setRenaming(true);
    try {
      await renameEventAction(event.id, name);
      toast.success('Event renamed');
    } catch {
      toast.error('Could not rename the event');
    } finally {
      setRenaming(false);
    }
  };

  const replace = async () => {
    if (!file) return;
    setReplacing(true);
    try {
      await replaceTemplateAction(event.id, await uploadImage(file));
      setFile(null);
      toast.success('Template replaced. Check the name placement on the Design tab.');
    } catch {
      toast.error('Could not replace the template');
    } finally {
      setReplacing(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await deleteEventAction(event.id);
    } catch (err) {
      if ((err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err;
      toast.error('Could not delete the event');
      setDeleting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <div className="space-y-4">
      <section className="card p-4">
        <form onSubmit={rename}>
          <label className="label" htmlFor="rename">Event name <span className="font-normal text-faint">· shown on the claim page</span></label>
          <div className="flex gap-2">
            <input id="rename" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            <button className="btn-secondary shrink-0" disabled={renaming || !name.trim() || name.trim() === event.name}>
              {renaming && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </section>

      <BrandingCard event={event} />
      </div>

      <div className="space-y-4">
      <section className="card space-y-3 p-4">
        <div>
          <h3 className="text-sm font-bold">Replace template</h3>
          <p className="mt-0.5 text-xs text-muted">
            The name position carries over to a new design with the same proportions.
          </p>
        </div>
        <TemplateDropzone file={file} onChange={setFile} />
        {file && (
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setFile(null)} disabled={replacing}>Cancel</button>
            <button className="btn-primary" onClick={replace} disabled={replacing}>
              {replacing && <Loader2 className="h-4 w-4 animate-spin" />}
              Upload and replace
            </button>
          </div>
        )}
      </section>

      <section className="card flex items-center justify-between gap-4 border-danger/30 p-4">
        <div>
          <h3 className="text-sm font-bold text-danger">Delete event</h3>
          <p className="mt-0.5 text-xs text-muted">Removes the template, participant list and claim history. The claim link stops working.</p>
        </div>
        <button className="btn-secondary btn-sm shrink-0 text-danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </section>
      </div>

      <Modal open={confirmDelete} onClose={() => !deleting && setConfirmDelete(false)} title={`Delete “${event.name}”?`} description="This can't be undone.">
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</button>
          <button className="btn-danger" onClick={remove} disabled={deleting}>
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete event
          </button>
        </div>
      </Modal>
    </div>
  );
}

function BrandingCard({ event }: { event: CertEvent }) {
  const [organizer, setOrganizer] = useState(event.organizer ?? '');
  const [logo, setLogo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty = logo !== null || organizer.trim() !== (event.organizer ?? '');

  const save = async (patch?: { logoUrl: null }) => {
    setSaving(true);
    try {
      const logoUrl = patch ? null : logo ? await uploadImage(logo, 'logos') : undefined;
      await updateBrandingAction(event.id, { organizer, logoUrl });
      setLogo(null);
      toast.success(patch ? 'Logo removed' : 'Branding saved');
    } catch {
      toast.error('Could not save the branding');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card space-y-3 p-4">
      <div>
        <h3 className="text-sm font-bold">Branding</h3>
        <p className="mt-0.5 text-xs text-muted">Shown on the claim page so participants know it&apos;s official.</p>
      </div>
      <LogoPicker file={logo} currentUrl={event.logoUrl} onChange={setLogo} onRemove={() => save({ logoUrl: null })} />
      <div className="flex gap-2">
        <input
          id="organizer-settings"
          className="input"
          placeholder="Organized by, e.g. DevCon Philippines"
          aria-label="Organized by"
          value={organizer}
          onChange={(e) => setOrganizer(e.target.value)}
        />
        <button className="btn-secondary shrink-0" onClick={() => save()} disabled={saving || !dirty}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save
        </button>
      </div>
    </section>
  );
}
