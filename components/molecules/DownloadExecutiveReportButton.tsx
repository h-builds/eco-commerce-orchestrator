'use client';

import { useState, useCallback } from 'react';
import { useSimulation } from '../../lib/SimulationContext';
import { useReportData } from '../../lib/ReportDataContext';
import { getHexSeedForHour } from '../../lib/hexSeed';
import { getEfficiencyForHour } from '../../lib/efficiencyScore';
import type { ExecutiveReportSnapshot } from '../../lib/executiveReportPdf';

const NETWORK_ROI_DISPLAY = 412;

/**
 * Orchestrates client-side PDF generation of executive performance audits. 
 * Utilizes dynamic library injection to bypass Edge Worker memory 
 * constraints while preserving main-thread responsiveness during 
 * complex DOM-to-Canvas rasterization.
 */
export function DownloadExecutiveReportButton() {
  const { simulatedHour } = useSimulation();
  const { reportData, chartContainerRef } = useReportData();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleClick = useCallback(async () => {
    if (!reportData || isGenerating) return;

    setIsGenerating(true);
    let chartDataUrl: string | null = null;

    try {
      if (chartContainerRef.current) {
        try {
          const html2canvas = (await import('html2canvas')).default;
          const canvas = await html2canvas(chartContainerRef.current, {
            useCORS: true,
            scale: 2,
            backgroundColor: '#0f172a',
            logging: false,
          });
          chartDataUrl = canvas.toDataURL('image/png');
        } catch (error) {
          /** 
           * Silent degradation: proceeds with text-only payload if 
           * rasterization triggers DOM/CORS complexity issues. 
           */
          console.warn('[Report] Chart snapshot failed, omitting from PDF.', error);
        }
      }

      const now = new Date();
      const effectiveHour =
        simulatedHour !== null ? simulatedHour : now.getHours();
      const snapshot: ExecutiveReportSnapshot = {
        simulatedHour,
        hexSeed: getHexSeedForHour(now, effectiveHour),
        efficiencyScore: getEfficiencyForHour(effectiveHour),
        totalSavings: reportData.totalSavings,
        networkROI: NETWORK_ROI_DISPLAY,
        averageLatency: reportData.averageLatency,
        peakDemandCount: reportData.peakDemandCount,
        sustainableSurplusCount: reportData.sustainableSurplusCount,
        neutralCount: reportData.neutralCount,
      };

      const { generateExecutiveReport } = await import(
        '../../lib/executiveReportPdf'
      );
      generateExecutiveReport(snapshot, chartDataUrl);
    } finally {
      setIsGenerating(false);
    }
  }, [reportData, simulatedHour, chartContainerRef, isGenerating]);

  const disabled = !reportData || isGenerating;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={[
        'inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-sm font-bold tracking-wide text-slate-200 backdrop-blur-md transition-colors',
        disabled
          ? 'cursor-not-allowed opacity-60'
          : 'hover:border-slate-600 hover:bg-slate-800/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50',
      ].join(' ')}
      aria-label={
        disabled
          ? 'Preparing report…'
          : 'Download Executive Report as PDF'
      }
    >
      <span
        className="material-symbols-outlined notranslate text-lg"
        aria-hidden="true"
       translate="no">
        picture_as_pdf
      </span>
      {isGenerating ? 'Generating…' : 'Download Executive Report'}
    </button>
  );
}
