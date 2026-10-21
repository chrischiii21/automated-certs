"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

/** Greets a brand-new account once, then removes ?welcome=1 from the URL. */
export function WelcomeToast() {
  const params = useSearchParams();
  const router = useRouter();
  const welcome = params.get('welcome') === '1';

  useEffect(() => {
    if (!welcome) return;
    toast.success('Your email is verified and your account is ready. Anything you made as a guest has been saved.');
    const next = new URLSearchParams(params);
    next.delete('welcome');
    router.replace(`${window.location.pathname}${next.size ? `?${next}` : ''}`, { scroll: false });
  }, [welcome, params, router]);

  return null;
}
