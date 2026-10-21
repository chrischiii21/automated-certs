"use client";

import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function CopyLinkButton({ eventId, className, label = 'Copy claim link' }: { eventId: string; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/claim/${eventId}`);
      setCopied(true);
      toast.success('Claim link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <button type="button" onClick={copy} className={cn('btn-secondary', className)}>
      {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
      {label}
    </button>
  );
}
