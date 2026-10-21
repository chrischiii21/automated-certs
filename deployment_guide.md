# Deployment Guide: Certify

Certify runs on **Vercel** (Next.js app), **Turso** (database) and **Vercel Blob** (template images).

## 1. Create the Turso database

```bash
# install the CLI: https://docs.turso.tech/cli/installation
turso auth login
turso db create certify
turso db show certify --url        # → TURSO_DATABASE_URL (libsql://…)
turso db tokens create certify     # → TURSO_AUTH_TOKEN
```

You don't need to run any SQL. The tables are created automatically the first time the app connects.

## 2. Create the Blob store

In the Vercel dashboard, open your project → **Storage** → **Create** → **Blob**, then connect it to the project.
This adds `BLOB_READ_WRITE_TOKEN` to the project automatically. For local development, copy it from the
store's **.env.local** tab.

## 3. Environment variables

Set these in Vercel (**Settings → Environment Variables**) and in `.env.local` for local development
(see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `APP_URL` | Your site's public URL, e.g. `https://certify.example.com`. Used in verification emails, the sitemap and social previews |
| `SESSION_SECRET` | **Required.** Long random string that signs login cookies |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | **Required for sign-up.** The Gmail address that sends email-verification and password-reset links, and a Google [App Password](https://myaccount.google.com/apppasswords) (needs 2-Step Verification). About 500 emails/day |
| `ADMIN_EMAIL` | Optional. Signing in with this email takes over events created before accounts existed |
| `TURSO_DATABASE_URL` | From step 1. Leave empty locally to use a `local.db` file |
| `TURSO_AUTH_TOKEN` | From step 1 |
| `BLOB_READ_WRITE_TOKEN` | From step 2 |
| `GROQ_API_KEY` | Optional. Turns on **Auto-style** in the design editor (free key at console.groq.com/keys) |

## 4. Move existing events from Supabase (one time)

If you have events in the old Supabase project, add `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local` next to the Turso and Blob values, then run:

```bash
bun run migrate:supabase
```

This copies each event and its template image. Event IDs are kept, so claim links you already shared still work.
Migrated events start as **Draft**: import each one's participant list, then click **Open claiming**.
You can run the script again safely; events that were already copied are skipped.

## 5. Deploy

Push to GitHub and import the repo in Vercel, or run `vercel --prod`.

## Post-deployment checklist

- [ ] Open `/` (landing page) and `/robots.txt`, `/sitemap.xml`, `/llms.txt`
- [ ] Create an account at `/signup`, confirm the verification email arrives (check Spam the first time), then log in at `/login`
- [ ] Create a test event and upload a template
- [ ] Add a name to the participant list and click **Open claiming**
- [ ] Open the claim link in a private window. A listed name should download; any other name should be refused.
