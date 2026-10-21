/** Public site details shared by metadata, sitemap, robots, llms.txt and the landing page. */

function resolveSiteUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'http://localhost:3000';
}

export const SITE = {
  name: 'Certify',
  /** Who owns and publishes Certify (shown in footers). */
  owner: 'CGM Digital Solutions',
  /** Who built it (page metadata and structured data). */
  creator: 'Christy Montejo',
  url: resolveSiteUrl(),
  title: 'Certify: Verified certificates only your participants can claim',
  description:
    'Create event certificates in minutes. Upload your design, add your participant list, and share one link: only listed participants can claim their certificate. Or bulk-create every certificate as a PDF or ZIP. Free to start.',
  keywords: [
    'certificate generator',
    'e-certificate',
    'certificate of participation',
    'bulk certificate generator',
    'event certificates',
    'webinar certificates',
    'certificate maker free',
    'claim certificate link',
  ],
};

export const FAQS = [
  {
    q: 'How does Certify stop random people from claiming certificates?',
    a: 'You upload your participant list. When someone opens your claim link and types their name, Certify checks it against that list on the server. Only listed names can download a certificate, and the list itself is never shown to visitors.',
  },
  {
    q: 'What if a participant types their name slightly differently?',
    a: 'Matching ignores capitalization, accents, punctuation and extra spaces, so "jose dela-cruz" matches "José Dela Cruz". The certificate always shows the name exactly as you wrote it in your list.',
  },
  {
    q: 'Can I create all the certificates myself instead of sharing a link?',
    a: 'Yes. Bulk create generates a certificate for everyone on your list (or just the rows you select) as one print-ready PDF or a ZIP of PNG images. Claiming does not need to be open.',
  },
  {
    q: 'What file can I use as the certificate design?',
    a: 'Any PNG, JPG or WebP image up to 20 MB, such as a design exported from Canva, Photoshop or PowerPoint. Leave a blank space for the name, then drag the name into place in the editor.',
  },
  {
    q: 'Is Certify free?',
    a: 'Yes. You can try it without an account. Creating a free account with your email and a password (we verify your email once) lets you share claim links, bulk-create certificates and keep unlimited events.',
  },
  {
    q: 'How do participants import from Excel or Google Sheets?',
    a: 'Export your sheet as CSV and upload it, or paste the names straight in. Certify recognizes a "Name" column or separate "First name" and "Last name" columns.',
  },
];
