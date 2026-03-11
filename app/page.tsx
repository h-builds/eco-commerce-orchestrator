import Link from "next/link";
import type { Metadata } from "next";

export const metadata = {
  title: "Shop",
};

// --- Data: architecture pillars rendered as cards ---
const PILLARS = [
  {
    icon: "memory",
    label: "React Compiler",
    description:
      "Zero-hook, pure-function components that the React 19 Compiler auto-memoizes without a single useMemo or useCallback.",
  },
  {
    icon: "ssid_chart",
    label: "AI Pricing Agent",
    description:
      "Deterministic Go microservice compiled to Wasm. Seed-based volatility guarantees identical prices across all stateless Worker instances within the same hour.",
  },
  {
    icon: "speed",
    label: "Edge-first Streaming",
    description:
      "Async RSC + Suspense boundaries push the LCP below 0.8 s. Skeleton states stream immediately; data hydrates on the edge without a round-trip to origin.",
  },
  {
    icon: "verified_user",
    label: "WCAG 2.1 AA",
    description:
      "Every interactive element ships with context-sensitive aria-labels, focus-visible rings, and keyboard navigation—audited to WCAG 2.1 Level AA.",
  },
] as const;

// --- Stat bar ---
const STATS = [
  { value: "< 0.8 s", label: "Target LCP" },
  { value: "React 19", label: "RSC + Compiler" },
  { value: "Go Wasm", label: "Pricing Agent" },
  { value: "D1 + KV", label: "Edge Storage" },
] as const;

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 font-sans">
      {/* ── Skip-to-content for keyboard / AT users ────────────────────── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white focus:font-bold focus:shadow-lg">
        Skip to main content
      </a>

      {/* ── Top nav bar ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-10">
          <div className="flex items-center gap-2 text-primary font-black text-lg tracking-tight">
            <span className="material-symbols-outlined" aria-hidden="true">
              eco
            </span>
            Eco-Commerce
          </div>
          <nav aria-label="Primary navigation">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-white transition-all hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30">
              <span
                className="material-symbols-outlined text-sm"
                aria-hidden="true">
                shopping_bag
              </span>
              Enter Shop
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <main id="main-content">
        <section
          aria-labelledby="hero-heading"
          className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 py-24 md:py-36">
          {/* Decorative blobs */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-emerald-400/10 blur-3xl"
          />

          <div className="relative mx-auto max-w-6xl px-4 md:px-10 text-center">
            {/* Eyebrow pill */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <span
                className="material-symbols-outlined text-sm"
                aria-hidden="true">
                architecture
              </span>
              Architectural Showcase · 2026
            </div>

            <h1
              id="hero-heading"
              className="mx-auto max-w-4xl text-5xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-slate-50 leading-[1.05]">
              The Future of <span className="text-primary">AI-Powered</span>{" "}
              Commerce
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
              A production-grade orchestrator uniting React&nbsp;19 Server
              Components, deterministic Go pricing agents, and Cloudflare Edge
              infrastructure — built to the highest standards for Senior &amp;
              Lead engineering roles.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/shop"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-white shadow-lg shadow-primary/25 transition-all hover:brightness-110 hover:shadow-xl hover:shadow-primary/30 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
                aria-label="Enter the product showcase shop">
                <span className="material-symbols-outlined" aria-hidden="true">
                  storefront
                </span>
                Enter Shop
                <span
                  className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1"
                  aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 py-4 text-base font-bold text-slate-700 dark:text-slate-200 transition-all hover:border-primary hover:text-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30">
                <span
                  className="material-symbols-outlined text-sm"
                  aria-hidden="true">
                  code
                </span>
                View Source
              </a>
            </div>
          </div>
        </section>

        {/* ── Stats bar ──────────────────────────────────────────────────── */}
        <section
          aria-label="Architecture at a glance"
          className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="mx-auto max-w-6xl px-4 md:px-10">
            <dl className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-200 dark:divide-slate-800">
              {STATS.map(({ value, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center py-8 gap-1">
                  <dt className="text-3xl font-black text-slate-900 dark:text-slate-50">
                    {value}
                  </dt>
                  <dd className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Pillars ────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="pillars-heading"
          className="py-24 bg-slate-50 dark:bg-slate-950">
          <div className="mx-auto max-w-6xl px-4 md:px-10">
            <div className="mb-12 text-center">
              <h2
                id="pillars-heading"
                className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                Architectural Pillars
              </h2>
              <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                Every layer of the stack is purpose-built for correctness,
                performance, and accessibility.
              </p>
            </div>

            <ul
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              aria-label="Architecture pillars">
              {PILLARS.map(({ icon, label, description }) => (
                <li
                  key={label}
                  className="group flex flex-col gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 transition-shadow hover:shadow-lg hover:shadow-primary/5">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"
                    aria-hidden="true">
                    <span className="material-symbols-outlined text-primary">
                      {icon}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                    {label}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="cta-heading"
          className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-24">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <span
              className="material-symbols-outlined text-4xl text-primary mb-4 block"
              aria-hidden="true">
              eco
            </span>
            <h2
              id="cta-heading"
              className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
              Ready to explore?
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              Browse the live product catalog with real-time AI prices generated
              on the Edge.
            </p>
            <Link
              href="/shop"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-white shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
              aria-label="Browse the eco-commerce product shop">
              <span className="material-symbols-outlined" aria-hidden="true">
                shopping_bag
              </span>
              Browse Products
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8">
        <div className="mx-auto max-w-6xl px-4 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            &copy; 2026 Eco-Commerce Orchestrator. Built with Next.js&nbsp;16,
            React&nbsp;19, and Go&nbsp;Wasm on Cloudflare&nbsp;Workers.
          </p>
          <p aria-label="WCAG compliance badge">WCAG 2.1 AA Compliant</p>
        </div>
      </footer>
    </div>
  );
}
