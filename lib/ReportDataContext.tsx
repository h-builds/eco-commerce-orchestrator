'use client';

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface ReportDataSnapshot {
  totalSavings: number;
  averageLatency: number;
  peakDemandCount: number;
  sustainableSurplusCount: number;
  neutralCount: number;
}

interface ReportDataContextValue {
  reportData: ReportDataSnapshot | null;
  setReportData: (data: ReportDataSnapshot | null) => void;
  chartContainerRef: React.RefObject<HTMLDivElement | null>;
}

const ReportDataContext = createContext<ReportDataContextValue | null>(null);

export function ReportDataProvider({ children }: { children: ReactNode }) {
  const [reportData, setReportData] = useState<ReportDataSnapshot | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  return (
    <ReportDataContext.Provider
      value={{ reportData, setReportData, chartContainerRef }}
    >
      {children}
    </ReportDataContext.Provider>
  );
}

export function useReportData(): ReportDataContextValue {
  const ctx = useContext(ReportDataContext);
  if (!ctx) {
    throw new Error('useReportData must be used within ReportDataProvider');
  }
  return ctx;
}
