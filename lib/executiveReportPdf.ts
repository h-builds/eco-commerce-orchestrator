import { jsPDF } from 'jspdf';

export interface ExecutiveReportSnapshot {
  simulatedHour: number | null;
  hexSeed: string;
  efficiencyScore: number;
  totalSavings: number;
  networkROI: number;
  averageLatency: number;
  peakDemandCount: number;
  sustainableSurplusCount: number;
  neutralCount: number;
}

const MARGIN = 20;
const PAGE_WIDTH = 210; // A4 mm
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 7;
const SECTION_GAP = 10;

function formatSimulatedHour(simulatedHour: number | null): string {
  if (simulatedHour === null) return 'Live';
  const h = simulatedHour % 12 || 12;
  const suffix = simulatedHour >= 12 ? 'PM' : 'AM';
  return `${h}:00 ${suffix}`;
}

/**
 * Generates and downloads the Orchestrator Edge Performance Audit PDF.
 * Client-only; run in browser.
 */
export function generateExecutiveReport(
  snapshot: ExecutiveReportSnapshot,
  chartImageDataUrl?: string | null
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = MARGIN;

  // 1. Executive header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 30);
  doc.text('Orchestrator Edge Performance Audit', MARGIN, y);
  y += LINE_HEIGHT * 2;

  // 2. System metadata
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('System Metadata', MARGIN, y);
  y += LINE_HEIGHT;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 50);
  doc.text(`Simulated Hour: ${formatSimulatedHour(snapshot.simulatedHour)}`, MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(`Global Price Seed (Hex): 0x${snapshot.hexSeed}`, MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(`Efficiency Score: ${snapshot.efficiencyScore}%`, MARGIN, y);
  y += LINE_HEIGHT + SECTION_GAP;

  // 3. KPI summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 30);
  doc.text('KPI Summary', MARGIN, y);
  y += LINE_HEIGHT;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 50);
  const savingsFormatted = snapshot.totalSavings.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  doc.text(`Total Live Savings: $${savingsFormatted}`, MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(`Network ROI: +${snapshot.networkROI}%`, MARGIN, y);
  y += LINE_HEIGHT + SECTION_GAP;

  // 4. Wasm Execution Latency chart image
  if (chartImageDataUrl) {
    try {
      const imgProps = doc.getImageProperties(chartImageDataUrl);
      const chartWidth = CONTENT_WIDTH;
      const chartHeight = (imgProps.height * chartWidth) / imgProps.width;
      // Ensure we don't overflow page; cap height if needed
      const maxChartHeight = 80;
      const h = Math.min(chartHeight, maxChartHeight);
      const w = chartHeight <= maxChartHeight ? chartWidth : (imgProps.width * h) / imgProps.height;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Wasm Execution Latency', MARGIN, y);
      y += LINE_HEIGHT;
      doc.addImage(chartImageDataUrl, 'PNG', MARGIN, y, w, h);
      y += h + SECTION_GAP;
    } catch {
      // If image fails, add a placeholder line and continue
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Wasm Execution Latency: chart capture unavailable', MARGIN, y);
      y += LINE_HEIGHT + SECTION_GAP;
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Wasm Execution Latency', MARGIN, y);
    y += LINE_HEIGHT;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Avg Latency: ${snapshot.averageLatency.toFixed(2)} ms`, MARGIN, y);
    y += LINE_HEIGHT + SECTION_GAP;
  }

  // 5. Demand Distribution summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 30);
  doc.text('Demand Distribution', MARGIN, y);
  y += LINE_HEIGHT;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 50);
  doc.text(`Peak Demand: ${snapshot.peakDemandCount} nodes`, MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(`Sustainable Surplus: ${snapshot.sustainableSurplusCount} nodes`, MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(`Neutral: ${snapshot.neutralCount} nodes`, MARGIN, y);

  doc.save('orchestrator-edge-audit.pdf');
}
