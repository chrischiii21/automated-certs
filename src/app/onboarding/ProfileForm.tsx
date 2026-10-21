"use client";

import { useActionState, useState } from 'react';
import { ArrowRight, Building2, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/lib/accounts';
import { USE_CASES } from '@/lib/profile';
import { saveProfileAction, type ProfileState } from './actions';

export function ProfileForm({ profile, next, isNew }: { profile: UserProfile; next: string; isNew: boolean }) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(saveProfileAction, { error: null });
  const [type, setType] = useState(profile.accountType ?? 'individual');

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      {isNew && <input type="hidden" name="isNew" value="1" />}

      <div>
        <span className="label">I&apos;m using Certify as</span>
        <div className="grid grid-cols-2 gap-2">
          {([
            { id: 'individual', icon: User, title: 'An individual', body: 'Teacher, speaker, freelancer' },
            { id: 'organization', icon: Building2, title: 'An organization', body: 'School, company, group' },
          ] as const).map((o) => (
            <label
              key={o.id}
              className={cn(
                'flex cursor-pointer flex-col rounded-xl border-2 p-3 transition-colors',
                type === o.id ? 'border-accent bg-accent-soft/60' : 'border-line hover:border-line-strong',
              )}
            >
              <input type="radio" name="accountType" value={o.id} checked={type === o.id} onChange={() => setType(o.id)} className="sr-only" />
              <o.icon className={cn('h-5 w-5', type === o.id ? 'text-accent' : 'text-muted')} />
              <span className="mt-2 text-sm font-semibold">{o.title}</span>
              <span className="text-xs text-muted">{o.body}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="name" className="label">Your full name</label>
        <input id="name" name="name" className="input h-11" defaultValue={profile.name ?? ''} placeholder="e.g. Maria Santos" autoComplete="name" required autoFocus />
      </div>

      {type === 'organization' && (
        <div>
          <label htmlFor="organization" className="label">Organization name</label>
          <input id="organization" name="organization" className="input h-11" defaultValue={profile.organization ?? ''} placeholder="e.g. DevCon Philippines" autoComplete="organization" required />
          <p className="mt-1 text-xs text-faint">Used as “Organized by” on new events. You can change it per event.</p>
        </div>
      )}

      <div>
        <label htmlFor="useCase" className="label">What will you use it for? <span className="font-normal text-faint">(optional)</span></label>
        <select id="useCase" name="useCase" className="input h-11" defaultValue={profile.useCase ?? ''}>
          <option value="">Choose one</option>
          {USE_CASES.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      {state.error && <p className="text-sm font-medium text-danger">{state.error}</p>}

      <button className="btn-primary h-11 w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isNew ? 'Continue to my dashboard' : 'Save profile'}
        {!pending && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}
