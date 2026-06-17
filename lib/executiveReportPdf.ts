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

const PAGE_WIDTH = 210;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

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
  
  const SLATE_900 = [15, 23, 42];
  const EMERALD_500 = [16, 185, 129];
  const CYAN_500 = [6, 182, 212];
  const SLATE_50 = [248, 250, 252];
  const SLATE_300 = [203, 213, 225];
  const TEXT_DARK = [20, 20, 30];
  const TEXT_MUTED = [100, 116, 139];

  doc.setFillColor(SLATE_900[0], SLATE_900[1], SLATE_900[2]);
  doc.rect(0, 0, PAGE_WIDTH, 45, 'F');
  
  doc.setFillColor(EMERALD_500[0], EMERALD_500[1], EMERALD_500[2]);
  doc.rect(0, 45, PAGE_WIDTH, 2, 'F');

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(SLATE_50[0], SLATE_50[1], SLATE_50[2]);
  doc.text('EDGE PERFORMANCE AUDIT', MARGIN, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(CYAN_500[0], CYAN_500[1], CYAN_500[2]);
  doc.text('ECO-COMMERCE ORCHESTRATOR', MARGIN, 30);

  const printDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  doc.setFontSize(9);
  doc.setTextColor(SLATE_300[0], SLATE_300[1], SLATE_300[2]);
  doc.text(`GENERATED: ${printDate}`, PAGE_WIDTH - MARGIN, 30, { align: 'right' });

  let y = 65;

  const drawSectionTitle = (title: string, yPos: number) => {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.text(title.toUpperCase(), MARGIN, yPos);
    
    doc.setDrawColor(SLATE_300[0], SLATE_300[1], SLATE_300[2]);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, yPos + 3, PAGE_WIDTH - MARGIN, yPos + 3);
    return yPos + 12;
  };

  const drawKpiBox = (label: string, value: string, xPos: number, yPos: number, width: number) => {
    doc.setDrawColor(SLATE_300[0], SLATE_300[1], SLATE_300[2]);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(xPos, yPos, width, 22, 2, 2, 'FD');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(label, xPos + 5, yPos + 8);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.text(value, xPos + 5, yPos + 18);
  };

  y = drawSectionTitle('System Overview & Returns', y);
  
  const boxWidth = (CONTENT_WIDTH - 10) / 3;
  drawKpiBox('SIMULATED HOUR', formatSimulatedHour(snapshot.simulatedHour), MARGIN, y, boxWidth);
  drawKpiBox('EFFICIENCY SCORE', `${snapshot.efficiencyScore}%`, MARGIN + boxWidth + 5, y, boxWidth);
  drawKpiBox('NETWORK ROI', `+${snapshot.networkROI}%`, MARGIN + (boxWidth + 5) * 2, y, boxWidth);
  
  y += 28;

  const savingsFormatted = snapshot.totalSavings.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  drawKpiBox('TOTAL LIVE SAVINGS', `$${savingsFormatted}`, MARGIN, y, boxWidth * 2 + 5);
  drawKpiBox('GLOBAL PRICE SEED', `0x${snapshot.hexSeed}`, MARGIN + (boxWidth + 5) * 2, y, boxWidth);
  
  y += 35;

  y = drawSectionTitle('Wasm Telemetry & Demand', y);

  if (chartImageDataUrl) {
    try {
      const imgProps = doc.getImageProperties(chartImageDataUrl);
      const chartWidth = CONTENT_WIDTH;
      const chartHeight = (imgProps.height * chartWidth) / imgProps.width;
      const maxChartHeight = 70;
      const h = Math.min(chartHeight, maxChartHeight);
      const w = chartHeight <= maxChartHeight ? chartWidth : (imgProps.width * h) / imgProps.height;

      doc.setDrawColor(SLATE_300[0], SLATE_300[1], SLATE_300[2]);
      doc.rect(MARGIN - 1, y - 1, w + 2, h + 2, 'S');
      doc.addImage(chartImageDataUrl, 'PNG', MARGIN, y, w, h);
      y += h + 10;
    } catch {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
      doc.text('Telemetry chart capture unavailable.', MARGIN, y);
      y += 10;
    }
  } else {
    drawKpiBox('AVG WASM LATENCY', `${snapshot.averageLatency.toFixed(2)} ms`, MARGIN, y, boxWidth);
    y += 28;
  }

  const distBoxWidth = (CONTENT_WIDTH - 10) / 3;
  drawKpiBox('PEAK DEMAND NODES', `${snapshot.peakDemandCount}`, MARGIN, y, distBoxWidth);
  drawKpiBox('SUSTAINABLE SURPLUS', `${snapshot.sustainableSurplusCount}`, MARGIN + distBoxWidth + 5, y, distBoxWidth);
  drawKpiBox('NEUTRAL NODES', `${snapshot.neutralCount}`, MARGIN + (distBoxWidth + 5) * 2, y, distBoxWidth);

  y += 30;

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(SLATE_300[0], SLATE_300[1], SLATE_300[2]);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, pageHeight - 20, PAGE_WIDTH - MARGIN, pageHeight - 20);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text('Eco-Commerce Orchestrator - Go-Wasm Pricing Engine', MARGIN, pageHeight - 15);
  doc.text('Page 1 of 1', PAGE_WIDTH - MARGIN, pageHeight - 15, { align: 'right' });

  doc.save('orchestrator-edge-audit.pdf');
}
