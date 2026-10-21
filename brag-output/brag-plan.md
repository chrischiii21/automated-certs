# /brag plan — Certify

**What it is:** Certify makes event certificates that only the people on your participant list can claim.
**For:** organizers of workshops, webinars, school events, hackathons. Upload a design, add the list, share one link.
**What sets it apart:** the claim link is gated. The name is checked against the list on the server; gate-crashers get "not on the list".
**Funniest true claim:** "Gate-crashers get a polite 'not on the list', never a certificate."
**Most impressive:** "jose dela-cruz" matches "José Dela Cruz", and the certificate prints the name exactly as listed.
**Visual hook:** someone typing a name they shouldn't have, and the real red "isn't on the participant list" alert.
**Share caption:** see `share-copy.txt`.

## Angle
Open on the product saying no. Then show what it says yes to: the three steps and the verified claim.

## Tone
`default`: punchy, clean, in Certify's own look. Canvas `#f6f5f1`, ink `#1c1b18`, accent `#3346d3`, success `#15803d`, gold certificate border `#c9a55a`. Playfair Display for headlines, Plus Jakarta Sans for UI. Lucide icons taken from the app.

## Format
Landscape 1920×1080, 30fps, **30s** (the user asked for 30s, longer than brag's usual 20s). 120 BPM, so one bar is 2s and every cut lands on a bar line.

## Storyboard

| # | Time | Scene | On screen |
|---|---|---|---|
| 1 | 0–4s | **Hook: gate-crasher** | Claim page. Someone types "Definitely Attended", hits *Get my certificate*, sees "Checking the list…", then the real danger alert. Headline: *Not on the list? No certificate.* |
| 2 | 4–8s | **Reveal** | Certify logo, then *Certificates only your real participants can claim.* (the site's H1, accent on "real participants") |
| 3 | 8–12s | **1 · Upload your design** | A gold certificate drops into the editor. The name box slides into the blank. An *Auto-styled* pill pops in. |
| 4 | 12–16s | **2 · Add your list** | The spreadsheet-style participant table fills row by row, with a *Rows: 248* footer. |
| 5 | 16–22s | **3 · Share one link** | A participant types "jose dela-cruz". The live preview has the PREVIEW watermark. Then *You're on the list*, the watermark clears, and the certificate shows **José Dela Cruz** with *Verified certificate*. Caption: *Typos forgiven. Name printed exactly as listed.* |
| 6 | 22–26s | **Or bulk-create** | PDF / ZIP format cards, progress 248 / 248, claim-rate meter at 82%. Caption: *Or bulk-create them all: one PDF or a ZIP.* |
| 7 | 26–30s | **Outro** | Ink panel. Certify wordmark, *Your next event's certificates, sorted.* A browser address bar types `automate-n-certify.vercel.app` and "presses Enter". *Free to start · no credit card*. |

## Formats
Landscape 1920×1080 (`brag.mp4`) and vertical 9:16 1080×1920 (`brag-vertical.mp4`). Both come from the same timeline and soundtrack; `video.html?format=vertical` restacks each scene.

## Voice-over
Female voice (Kokoro `af_heart`), warm and confident, like a friendly product demo for organizers. Music ducks under it.

| At | Line |
|---|---|
| 1.0s | Not on the list? No certificate. |
| 4.15s | Meet Certify. Certificates only your real participants can claim. |
| 8.4s | Upload your design, and drop the name right where it goes. |
| 12.5s | Paste your participant list, or upload a CSV. |
| 16.4s | Share one link. Certify checks every name against your list, and prints it exactly right. |
| 22.4s | Rather send them yourself? Bulk-create them all at once. |
| 26.5s | Certify. Your next event's certificates, sorted. |

## Data hygiene
All names are fictional stand-ins (Juan/José Dela Cruz are the site's own demo names). "248 participants / 82%" comes from the landing page's own mock-up. No URLs, emails, or env values are used.

## Sound
A synthesized 120 BPM track in F major (Fmaj7 · Am7 · B♭maj7 · C) with soft kick, hats, bass, pad and pluck. SFX are tuned to the key and kept under the music: soft key ticks while typing, a low muted minor-second "nope" on denial, a chime arpeggio when the name is verified, and filtered-noise swells into each scene.
