/** Only allow redirects back into this app (avoids open redirects via ?next=). */
export function safeNext(next: string | undefined | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/admin';
}
