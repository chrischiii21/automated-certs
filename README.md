# Certify

Certificates that only the people on your participant list can claim.

**Organizers** (`/admin`): anyone can try one event as a guest. A free account (email + password; the email is verified once with an emailed link) unlocks sharing claim links, bulk create, AI auto-style and unlimited events. Guest work moves into the account on sign-up.

1. Create an event, upload the certificate design, and optionally add your logo and organization name for the claim page.
2. Place the name: drag it into position, or use **Auto-style** (Groq vision) to pick the font, color and position from your design. Long names shrink to fit.
3. Import the participant list: paste names or upload a CSV (a `Name` column, or `First name` + `Last name`).
4. Click **Open claiming** and share the link. The participant list shows who has claimed, and you can export it as CSV.

**Participants** (`/claim/<event-id>`) enter their name. The server checks it against the list,
ignoring case, accents, punctuation and extra spaces. If it matches, they download a PNG with the name exactly
as the organizer listed it. The list itself is never sent to the browser.

## Stack

Next.js 16 (App Router, Server Actions) · Turso / libSQL · Vercel Blob · Tailwind CSS 4

## Local development

```bash
cp .env.example .env.local   # set at least BLOB_READ_WRITE_TOKEN; add GMAIL_* to send real verification and password-reset emails
bun install
bun dev
```

If `TURSO_DATABASE_URL` is empty, the app uses a local SQLite file (`local.db`). Without Gmail credentials in development, verification and reset links are printed in the terminal running `bun dev`.

The public landing page is `/`, with `/robots.txt`, `/sitemap.xml` and `/llms.txt` generated from `src/lib/site.ts`.
Uploading templates always needs a Vercel Blob token.

See [deployment_guide.md](deployment_guide.md) for production setup and migrating from Supabase.
