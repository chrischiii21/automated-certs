import { redirect } from 'next/navigation';

// Password resets now use an emailed code on /forgot-password. Old reset links land here.
export default function ResetPage() {
  redirect('/forgot-password');
}
