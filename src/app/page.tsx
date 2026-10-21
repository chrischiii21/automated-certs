import Link from 'next/link';
import {
  ArrowRight, Award, BadgeCheck, Check, FileSpreadsheet, FileStack, ImageUp, ListChecks, Lock, Palette, Send,
  ShieldCheck, Smartphone, Sparkles, Table2, Users,
} from 'lucide-react';
import { FAQS, SITE } from '@/lib/site';

export const metadata = { alternates: { canonical: '/' } };

const FEATURES = [
  { icon: ShieldCheck, title: 'Only your participants can claim', body: 'Names are checked against your list on the server. Gate-crashers get a polite "not on the list", never a certificate.' },
  { icon: FileStack, title: 'Bulk create in one click', body: 'Generate every certificate as one print-ready PDF or a ZIP of PNGs. No claim link needed.' },
  { icon: Sparkles, title: 'AI auto-style', body: 'Picks a font, color and position that match your design, so names look typeset rather than pasted on.' },
  { icon: Table2, title: 'Spreadsheet-style tracking', body: 'Row numbers, sorting, search, inline edits, claim status and a claims-per-day chart.' },
  { icon: BadgeCheck, title: 'Branded claim pages', body: 'Your logo and organization name on every claim page, so participants know it’s official.' },
  { icon: Smartphone, title: 'Built for phones', body: 'Participants type their name, see a live preview and download on any device.' },
];

const STEPS = [
  { icon: ImageUp, title: 'Upload your design', body: 'Any PNG or JPG from Canva, Photoshop or PowerPoint. Leave a blank where the name goes.' },
  { icon: ListChecks, title: 'Add your participant list', body: 'Paste names or upload a CSV from Excel or Google Sheets.' },
  { icon: Send, title: 'Share or bulk-create', body: 'Send one claim link, or download every certificate yourself.' },
];

const USE_CASES = ['Workshops & trainings', 'Webinars', 'School events', 'Seminars & conferences', 'Fun runs & sports', 'Community & LGU programs', 'Hackathons', 'Volunteer drives'];

export default function LandingPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE.name,
      url: SITE.url,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: SITE.description,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      author: { '@type': 'Person', name: SITE.creator },
      publisher: { '@type': 'Organization', name: SITE.owner },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-transparent bg-canvas/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Main">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-canvas"><Award className="h-4.5 w-4.5" /></span>
            <span className="font-display text-xl font-semibold tracking-tight">{SITE.name}</span>
          </Link>
          <div className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
            <a href="#how-it-works" className="hover:text-ink">How it works</a>
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost btn-sm hidden sm:inline-flex">Log in</Link>
            <Link href="/admin" className="btn-primary btn-sm">Start free</Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative">
          <div className="pointer-events-none absolute inset-x-0 -top-24 h-[36rem] bg-[radial-gradient(ellipse_at_top,rgba(51,70,211,0.16),transparent_60%)]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-2 lg:pb-28 lg:pt-20">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border bg-surface px-3 py-1 text-xs font-semibold text-muted shadow-card">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Free to start · no credit card
              </p>
              <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-6xl">
                Certificates only your <span className="text-accent">real participants</span> can claim.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
                Upload your design, add your participant list and share one link. Each person types their name, Certify checks it
                against your list, and they download a certificate with their name already on it.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/admin" className="btn-primary h-12 px-6 text-base shadow-pop">
                  Create certificates free <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#how-it-works" className="btn-secondary h-12 px-6 text-base">See how it works</a>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
                {['No sign-up to try', 'PDF & ZIP bulk export', 'Works on any phone'].map((t) => (
                  <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> {t}</li>
                ))}
              </ul>
            </div>

            <HeroVisual />
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 border-y bg-surface py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="How it works" title="From design to delivered in three steps" />
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative rounded-2xl border bg-canvas p-6">
                  <span className="absolute right-5 top-4 font-display text-5xl font-semibold text-line">{i + 1}</span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-white shadow-card"><s.icon className="h-5 w-5" /></span>
                  <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="Features" title="Everything you need to issue certificates properly" />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <article key={f.title} className="card p-6 transition-shadow hover:shadow-pop">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent"><f.icon className="h-5 w-5" /></span>
                  <h3 className="mt-4 font-bold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Two ways to deliver */}
        <section className="pb-20">
          <div className="mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 md:grid-cols-2">
            <div className="rounded-3xl bg-ink p-8 text-canvas">
              <Lock className="h-6 w-6 text-[#93a3ff]" />
              <h3 className="mt-4 font-display text-2xl font-semibold">Share a claim link</h3>
              <p className="mt-2 text-canvas/70">
                Participants enter their name and download their own certificate. Unlisted names are turned away, and you can see who
                has claimed in real time.
              </p>
            </div>
            <div className="rounded-3xl border bg-surface p-8">
              <FileSpreadsheet className="h-6 w-6 text-accent" />
              <h3 className="mt-4 font-display text-2xl font-semibold">Or bulk-create them all</h3>
              <p className="mt-2 text-muted">
                Prefer to send them yourself? Generate every certificate as one PDF for printing, or a ZIP of images to email or upload.
              </p>
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="border-y bg-surface py-16">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">Made for organizers of</h2>
            <ul className="mt-6 flex flex-wrap justify-center gap-2.5">
              {USE_CASES.map((u) => (
                <li key={u} className="rounded-full border bg-canvas px-4 py-2 text-sm font-medium">{u}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading eyebrow="FAQ" title="Questions organizers ask" />
            <div className="mt-10 divide-y rounded-2xl border bg-surface">
              {FAQS.map((f) => (
                <details key={f.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    <h3>{f.q}</h3>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sunken text-muted transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-ink px-6 py-16 text-center text-canvas sm:px-12">
            <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-accent/50 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -right-10 h-72 w-72 rounded-full bg-success/25 blur-3xl" />
            <h2 className="relative font-display text-3xl font-semibold tracking-tight text-balance sm:text-5xl">Your next event&apos;s certificates, sorted.</h2>
            <p className="relative mx-auto mt-3 max-w-lg text-canvas/70">Try it now with no account. Sign up free when you&apos;re ready to share.</p>
            <Link href="/admin" className="btn relative mt-8 h-12 bg-canvas px-6 text-base text-ink hover:bg-white">
              Create certificates free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span>© {new Date().getFullYear()} {SITE.name} by <span className="font-semibold text-ink">{SITE.owner}</span></span>
          </div>
          <nav className="flex gap-5" aria-label="Footer">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
            <Link href="/login" className="hover:text-ink">Log in</Link>
            <Link href="/admin" className="hover:text-ink">Start free</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold text-accent">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
    </div>
  );
}

/** A certificate mock-up with floating proof points. Pure HTML, so it costs nothing to load. */
function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none" aria-hidden>
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-accent/15 via-transparent to-success/15 blur-2xl" />
      <div className="relative rotate-[1.5deg] rounded-2xl bg-surface p-2.5 shadow-pop">
        <div className="relative aspect-[1.414/1] overflow-hidden rounded-xl border-[6px] border-[#c9a55a] bg-[#fbf8ef] p-[6%] text-center">
          <div className="absolute inset-2 rounded-md border border-[#c9a55a]/50" />
          <p className="font-display text-[clamp(14px,3.4vw,28px)] font-semibold tracking-[0.18em] text-[#2b2a26]">CERTIFICATE</p>
          <p className="mt-1 text-[clamp(7px,1.3vw,11px)] font-semibold tracking-[0.3em] text-[#9a7b3a]">OF PARTICIPATION</p>
          <p className="mt-[6%] text-[clamp(7px,1.2vw,10px)] tracking-[0.2em] text-[#6b6860]">PROUDLY PRESENTED TO</p>
          <p className="mt-[3%] font-display text-[clamp(20px,5vw,42px)] italic text-[#1f5c33]">Juan Dela Cruz</p>
          <div className="mx-auto h-px w-2/3 bg-[#c9a55a]" />
          <p className="mx-auto mt-[4%] max-w-[80%] text-[clamp(6px,1.1vw,10px)] leading-relaxed text-[#6b6860]">
            for active participation in the Web Development Bootcamp 2026
          </p>
        </div>
      </div>

      <div className="absolute -left-3 top-8 flex items-center gap-2.5 rounded-xl bg-surface px-3.5 py-2.5 shadow-pop sm:-left-8">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success-soft text-success"><Check className="h-4 w-4" /></span>
        <div className="text-left">
          <p className="text-xs font-semibold">Juan Dela Cruz</p>
          <p className="text-[11px] text-success">Verified on the list</p>
        </div>
      </div>

      <div className="absolute -bottom-6 -right-2 w-56 rounded-xl bg-surface p-3.5 shadow-pop sm:-right-6">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-semibold"><Users className="h-3.5 w-3.5 text-accent" /> 248 participants</span>
          <span className="font-semibold text-success">82%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-success-soft"><div className="h-full w-[82%] rounded-full bg-success" /></div>
        <p className="mt-1.5 text-[11px] text-muted">203 certificates claimed</p>
      </div>

      <div className="absolute -top-4 right-6 hidden items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-canvas shadow-pop sm:flex">
        <Palette className="h-3.5 w-3.5" /> Auto-styled
      </div>
    </div>
  );
}
