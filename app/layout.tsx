import type { Metadata } from "next";
import "./globals.css";

// All fonts loaded via <link> tags for Cloudflare edge compatibility.
const GEIST_SANS_HREF =
  "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap";
const GEIST_MONO_HREF =
  "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap";
const MATERIAL_SYMBOLS_HREF =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block";

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
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
