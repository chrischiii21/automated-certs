import { FAQS, SITE } from '@/lib/site';

export const dynamic = 'force-static';

// llms.txt (https://llmstxt.org): a plain-language summary of the site for AI assistants and crawlers.
export function GET() {
  const body = `# ${SITE.name}

> ${SITE.description}

${SITE.name} is built by ${SITE.creator} and owned by ${SITE.owner}. It is a web app for event organizers (schools, workshops, webinars, seminars, fun runs, community and government programs) who need to issue certificates to a known list of participants.

## How it works

1. Upload a certificate design (PNG, JPG or WebP) with a blank space for the name.
2. Drag the name into place and choose its font, size and color, or let AI auto-style match it to the design.
3. Add the participant list by pasting names or uploading a CSV.
4. Either share one claim link, where participants type their name and only names on the list can download, or bulk-create every certificate as one PDF or a ZIP of PNGs.

## Key features

- Participant-list verification on the server; the list is never exposed to visitors
- Forgiving name matching (ignores capitalization, accents, punctuation and spacing)
- Live certificate preview with a watermark until the name is verified
- Bulk certificate generation (PDF or ZIP), no claim link required
- Spreadsheet-style participant tracker with claim status and CSV export
- Branded claim pages with the organizer's logo and name
- Free to try without an account; free accounts sign in with email and password after a one-time email verification

## Pages

- [Home](${SITE.url}/): product overview, features and FAQ
- [Create a free account](${SITE.url}/signup)
- [Log in](${SITE.url}/login)
- [Try it free](${SITE.url}/admin): start without an account

## FAQ

${FAQS.map((f) => `### ${f.q}\n${f.a}`).join('\n\n')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
