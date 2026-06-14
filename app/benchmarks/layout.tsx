import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Performance Benchmarks | Eco-Commerce',
  description: 'Live performance battle between Go-Wasm and JavaScript for real-time pricing computation.',
  openGraph: {
    title: 'Performance Benchmarks | Eco-Commerce',
    description: 'Live performance battle between Go-Wasm and JavaScript for real-time pricing computation.',
  },
  twitter: {
    title: 'Performance Benchmarks | Eco-Commerce',
  }
};

export default function BenchmarksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
