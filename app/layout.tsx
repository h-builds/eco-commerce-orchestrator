import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { TelemetryProvider } from "@/lib/TelemetryContext";
import { DebugBridge } from "@/components/providers/DebugBridge";
import { StressTestRegistryProvider } from "@/components/providers/StressTestRegistryProvider";
import { TourProvider } from "@/components/providers/TourProvider";
import { GlobalNav } from "@/components/organisms/GlobalNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * FOIT Mitigation: Injected via manual preload/script to circumvent the absence of 
 * native variable icon font support in 'next/font'. Ensures icons paint in 
 * parity with the primary layout shell on edge runtimes.
 */
const MATERIAL_SYMBOLS_HREF =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block";

const BASE_URL = "https://eco-commerce-orchestrator.pages.dev";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Eco-Commerce Orchestrator",
    template: "%s | Eco-Commerce Orchestrator",
  },
  description:
    "Production-grade AI pricing platform built with React 19, Go WebAssembly, and Cloudflare Workers. Real-time deterministic edge pricing with WCAG 2.1 AA accessibility.",
  openGraph: {
    title: "Eco-Commerce Orchestrator",
    description:
      "Production-grade AI pricing platform built with React 19, Go WebAssembly, and Cloudflare Workers.",
    url: BASE_URL,
    siteName: "Eco-Commerce Orchestrator",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eco-Commerce Orchestrator",
    description:
      "Production-grade AI pricing platform built with React 19, Go WebAssembly, and Cloudflare Workers.",
  },
};

/**
 * Synchronizes font variables at the root to prevent hydration mismatches 
 * during Edge delivery via Cloudflare Workers. 
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
             __html: JSON.stringify({
               "@context": "https://schema.org",
               "@type": "Organization",
               "name": "Eco-Commerce Orchestrator",
               "url": BASE_URL,
               "logo": `${BASE_URL}/eco-logo.png`,
             })
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="style"
          href={MATERIAL_SYMBOLS_HREF}
          crossOrigin="anonymous"
        />
        <noscript>
          <link rel="stylesheet" href={MATERIAL_SYMBOLS_HREF} crossOrigin="anonymous" />
        </noscript>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var l = document.createElement('link');
                l.rel = 'stylesheet';
                l.crossOrigin = 'anonymous';
                l.href = '${MATERIAL_SYMBOLS_HREF}';
                document.head.appendChild(l);
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased text-slate-900 dark:text-slate-50 bg-slate-50 dark:bg-slate-950 flex min-h-screen flex-col">
        <TourProvider>
          <TelemetryProvider>
            <StressTestRegistryProvider>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white focus:font-bold focus:shadow-lg">
                Skip to main content
              </a>

              <div className="flex min-h-screen flex-col border-x border-white/5 relative">
                <header className="sticky top-0 z-40 mx-4 rounded-2xl border border-white/10 bg-slate-500/5 backdrop-blur-xl">
                  <div className="mx-auto flex h-16 w-full items-center justify-between px-4 md:px-10 lg:px-20">
                    <Link
                      href="/"
                      className="flex items-center gap-2 text-primary font-black text-lg tracking-tight hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 rounded-lg">
                      <span
                        className="material-symbols-outlined notranslate"
                        aria-hidden="true" translate="no">
                        eco
                      </span>
                      Eco-Commerce
                    </Link>
                    <GlobalNav />
                  </div>
                </header>

                <main id="main-content" className="flex-grow pt-8" tabIndex={-1}>
                  {children}
                </main>

                <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 mt-auto">
                  <div className="mx-auto w-full px-4 md:px-10 lg:px-20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
                    <p>
                      &copy; 2026 Eco-Commerce Orchestrator. Orchestrated via Next.js&nbsp;16, 
                      Go&nbsp;Wasm runtime, and Cloudflare Workers.
                    </p>
                    <p aria-label="WCAG 2.1 AA compliance status">
                      WCAG 2.1 AA Compliant
                    </p>
                  </div>
                </footer>
              </div>

              <DebugBridge />
            </StressTestRegistryProvider>
          </TelemetryProvider>
        </TourProvider>
      </body>
    </html>
  );
}
