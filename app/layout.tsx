import type { Metadata } from "next";
import Link from "next/link";
import { TelemetryProvider } from "@/lib/TelemetryContext";
import { DebugBridge } from "@/components/providers/DebugBridge";
import { StressTestRegistryProvider } from "@/components/providers/StressTestRegistryProvider";
import { TourProvider } from "@/components/providers/TourProvider";
import { GlobalNav } from "@/components/organisms/GlobalNav";
import "./globals.css";

// All fonts loaded via <link> tags for Cloudflare edge compatibility.
const GEIST_SANS_HREF =
  "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap";
const GEIST_MONO_HREF =
  "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap";
const MATERIAL_SYMBOLS_HREF =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block";
const JETBRAINS_MONO_HREF =
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap";

export const metadata: Metadata = {
  title: {
    default: "Eco-Commerce Orchestrator",
    template: "%s | Eco-Commerce Orchestrator",
  },
  description: "High-performance AI Pricing platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to Google Fonts CDN for faster font load */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Geist Sans */}
        <link rel="stylesheet" href={GEIST_SANS_HREF} />
        {/* Geist Mono */}
        <link rel="stylesheet" href={GEIST_MONO_HREF} />
        {/* Material Symbols Outlined — variable font with display:block to prevent FOUT */}
        <link rel="stylesheet" href={MATERIAL_SYMBOLS_HREF} />
        {/* JetBrains Mono for Debug Console */}
        <link rel="stylesheet" href={JETBRAINS_MONO_HREF} />
      </head>
      <body className="font-sans antialiased text-slate-900 dark:text-slate-50 bg-slate-50 dark:bg-slate-950 flex min-h-screen flex-col">
        <TourProvider>
        <TelemetryProvider>
        <StressTestRegistryProvider>
        {/* ── Skip-to-content for keyboard / AT users ────────────────────── */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white focus:font-bold focus:shadow-lg">
          Skip to main content
        </a>

        {/* ── Boxed Architecture Main Frame ──────────────────────────────── */}
        <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col border-x border-white/5 relative">
          
          {/* ── Top Floating Nav Bar HUD ───────────────────────────────────── */}
          <header className="sticky top-4 z-40 mx-4 mt-4 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full items-center justify-between px-4 md:px-10 lg:px-20">
            <Link href="/" className="flex items-center gap-2 text-primary font-black text-lg tracking-tight hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 rounded-lg">
              <span className="material-symbols-outlined" aria-hidden="true">
                eco
              </span>
              Eco-Commerce
            </Link>
              <GlobalNav />
          </div>
          </header>

          <main id="main-content" className="flex-grow pt-8">
            {children}
          </main>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 mt-auto">
          <div className="mx-auto w-full px-4 md:px-10 lg:px-20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>
              &copy; 2026 Eco-Commerce Orchestrator. Built with Next.js&nbsp;16,
              React&nbsp;19, Go&nbsp;Wasm, and OpenNext on Cloudflare&nbsp;Workers.
            </p>
            <p aria-label="WCAG compliance badge">WCAG 2.1 AA Compliant</p>
            </div>
          </footer>
        </div>

        {/* Developer Debug Console — Ctrl+Shift+D or Cmd+Shift+D to toggle */}
          <DebugBridge />
        </StressTestRegistryProvider>
        </TelemetryProvider>
        </TourProvider>
      </body>
    </html>
  );
}
