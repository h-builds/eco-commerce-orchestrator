import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eco-Commerce Orchestrator — AI Production Stack",
  alternates: {
    canonical: "/",
  },
};

const PILLARS = [
  {
    icon: "memory",
    label: "React 19 Compiler",
    description:
      "Zero-hook, pure-function components auto-memoized by the React 19 Compiler. No useMemo, no useCallback — correctness is enforced by the compiler, not conventions.",
  },
  {
    icon: "ssid_chart",
    label: "Go Wasm Pricing Agent",
    description:
      "Deterministic pricing microservice compiled to WebAssembly. Seed-based volatility guarantees bit-identical prices across all stateless Worker instances within the same hour.",
  },
  {
    icon: "cloud",
    label: "OpenNext on Workers",
    description:
      "Deployed via @opennextjs/cloudflare — the official Cloudflare adapter. Static pages prerender at build time; API routes run as Cloudflare Workers with D1 + KV bindings.",
  },
  {
    icon: "verified_user",
    label: "WCAG 2.1 AA",
    description:
      "Every interactive element ships with context-sensitive aria-labels, focus-visible rings, and full keyboard navigation — audited to WCAG 2.1 Level AA.",
  },
] as const;

const STATS = [
  { value: "OpenNext", label: "CF Workers Adapter" },
  { value: "React 19", label: "RSC + Compiler" },
  { value: "Go Wasm", label: "Pricing Agent" },
  { value: "D1 + KV", label: "Edge Storage" },
] as const;

/**
 * Static landing view demonstrating Edge-native patterns. 
 * Leveraging React 19 server components via OpenNext to minimize client-side bundle 
 * while explaining Wasm-agent interop and WCAG 2.1 AA compliance strategies.
 */
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Eco-Commerce Orchestrator",
            "url": "https://eco-commerce-orchestrator.pages.dev/",
          })
        }}
      />
      <section
          aria-labelledby="hero-heading"
          className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 py-24 md:py-36">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-emerald-400/10 blur-3xl"
          />

          <div className="relative mx-auto w-full px-4 md:px-10 lg:px-20 text-center">
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
              Components, a deterministic Go&nbsp;Wasm pricing agent, and
              Cloudflare&nbsp;Workers via OpenNext — built to the highest
              standards for Senior &amp; Lead engineering roles.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/admin/dashboard"
                className="group inline-flex items-center gap-2 rounded-full border border-primary bg-primary/10 px-8 py-4 text-base font-bold text-primary shadow-lg shadow-primary/10 transition-all hover:bg-primary/20 hover:shadow-xl hover:shadow-primary/20 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
                aria-label="View the global analytics dashboard">
                <span className="material-symbols-outlined" aria-hidden="true">
                  query_stats
                </span>
                Admin Dashboard
              </Link>
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
                href="https://github.com/h-builds/eco-commerce-orchestrator"
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

        <section
          aria-label="Architecture at a glance"
          className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="mx-auto w-full px-4 md:px-10 lg:px-20">
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

        <section
          aria-labelledby="pillars-heading"
          className="py-24 bg-slate-50 dark:bg-slate-950">
          <div className="mx-auto w-full px-4 md:px-10 lg:px-20">
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
                    <span className="material-symbols-outlined text-primary" aria-hidden="true">
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
              Browse the live product catalog with AI-computed prices generated
              by the Go&nbsp;Wasm agent on every request.
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
    </>
  );
}
