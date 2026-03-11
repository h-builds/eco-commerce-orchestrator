import { Suspense } from 'react';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { D1Database } from '@cloudflare/workers-types';
import DashboardClient from '../../../components/organisms/DashboardClient';
import { ExecutiveBrief } from '../../../components/molecules/ExecutiveBrief';
import { DownloadExecutiveReportButton } from '../../../components/molecules/DownloadExecutiveReportButton';
import { SimulationProvider } from '../../../lib/SimulationContext';
import { ReportDataProvider } from '../../../lib/ReportDataContext';
import { BackButton } from '../../../components/molecules/BackButton';
import { StressTestTrigger } from '../../../components/molecules/StressTestTrigger';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const env = (await getCloudflareContext({ async: true })).env as unknown as {
    eco_db: D1Database;
  };
  const db = env.eco_db;

  if (!db) {
    throw new Error('Database connection is not configured.');
  }

  let results: Array<Record<string, unknown>> = [];
  try {
    const res = await db.prepare('SELECT id, price, stock, name FROM products').all();
    if (res.success) {
      results = res.results;
    }
  } catch (error) {
    console.warn('Failed to fetch dashboard products (expected during build/prerender):', error);
  }

  // Ensure plain objects
  const products = results.map((p) => ({
    id: p.id as string,
    price: p.price as number,
    stock: p.stock as number,
    name: p.name as string,
  }));

  return (
    <SimulationProvider>
      <ReportDataProvider>
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-slate-950 text-slate-50 pt-12 pb-24">
          {/* Background Glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
            <div className="absolute top-[20%] -right-[10%] h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[100px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl w-full px-4 md:px-10">
            <BackButton />

            <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Command Center
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                  Global Analytics
                </h1>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
                <StressTestTrigger products={products} />
                <ExecutiveBrief />
                <DownloadExecutiveReportButton />
              </div>
            </header>

            <Suspense fallback={<div className="h-96 w-full flex items-center justify-center text-slate-500">Initializing Network Data...</div>}>
              <DashboardClient initialProducts={products} />
            </Suspense>
          </div>
        </div>
      </ReportDataProvider>
    </SimulationProvider>
  );
}
