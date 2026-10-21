'use server';

import { redirect } from 'next/navigation';
import { saveUserProfile, type AccountType } from '@/lib/accounts';
import { requireUser } from '@/lib/auth';
import { USE_CASES } from '@/lib/profile';

export type ProfileState = { error: string | null };

function safeNext(next: unknown): string {
  const n = typeof next === 'string' ? next : '';
  return n.startsWith('/') && !n.startsWith('//') ? n : '/admin';
}

export async function saveProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireUser();
  const name = String(formData.get('name') ?? '').trim().slice(0, 120);
  const accountType: AccountType = formData.get('accountType') === 'organization' ? 'organization' : 'individual';
  const organization = String(formData.get('organization') ?? '').trim().slice(0, 200) || null;
  const useCaseRaw = String(formData.get('useCase') ?? '');
  const useCase = USE_CASES.includes(useCaseRaw) ? useCaseRaw : null;

  if (name.length < 2) return { error: 'Please enter your full name.' };
  if (accountType === 'organization' && !organization) return { error: 'Please enter your organization’s name.' };

  await saveUserProfile(user.userId, { name, accountType, organization: accountType === 'organization' ? organization : null, useCase });

  const next = safeNext(formData.get('next'));
  redirect(formData.get('isNew') ? `${next}${next.includes('?') ? '&' : '?'}welcome=1` : next);
}
