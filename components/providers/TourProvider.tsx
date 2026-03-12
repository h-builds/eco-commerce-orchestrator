'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

interface TourContextType {
  isTourCompleted: boolean;
  completeTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}

const TOUR_STEPS: Step[] = [
  {
    target: '.tour-orchestrator',
    content: "Welcome to the Edge. This system manages 1,000 products using Go-Wasm logic distributed across Cloudflare's global network.",
    disableBeacon: true,
    title: "The Orchestrator",
    placement: 'bottom',
  },
  {
    target: '.tour-time-machine',
    content: "Move this slider to travel through time. Watch how the deterministic Wasm agent re-calculates the entire market's pricing in real-time.",
    title: "The Time Machine",
    placement: 'bottom',
  },
  {
    target: '.tour-edge-map',
    content: "Every dot is a live product. Hover to see micro-data or watch them turn red during 'Surge' demand hours.",
    title: "The Edge Map",
    placement: 'bottom',
  },
  {
    target: '.tour-technical-audit',
    content: "Transparency is key. Monitor Wasm execution times (sub-millisecond) and ISR cache hits at the edge.",
    title: "Technical Audit",
    placement: 'top',
  },
  {
    target: '.tour-debug-console',
    content: "Press Ctrl+Shift+D anytime to see the 'Matrix'. Real-time telemetry logs directly from the Wasm binary.",
    title: "Debug Console",
    placement: 'top-start',
  }
];

export function TourProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [isTourCompleted, setIsTourCompleted] = useState(true);
  const [run, setRun] = useState(false);

  useEffect(() => {
    let mounted = true;
    setTimeout(() => {
      if (!mounted) return;
      setIsClient(true);
      const completed = localStorage.getItem('tour_completed') === 'true';
      setIsTourCompleted(completed);
      
      // Auto-start if not completed and on dashboard
      if (!completed && pathname === '/admin/dashboard') {
        // Small timeout to ensure components are mounted
        setTimeout(() => {
          if (mounted) setRun(true);
        }, 500);
      } else {
        setRun(false);
      }
    }, 0);
    return () => { mounted = false; };
  }, [pathname]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      setIsTourCompleted(true);
      if (isClient) {
        localStorage.setItem('tour_completed', 'true');
      }
    }
  };

  const completeTour = () => {
    setIsTourCompleted(true);
    setRun(false);
    if (isClient) {
      localStorage.setItem('tour_completed', 'true');
    }
  };

  // The provider wrapper needs to be accessible globally to render the joyride component.
  // Actually, Joyride should only render when run=true to avoid parsing step targets globally.
  // But since Joyride manages its own life cycle, it's safe to render it conditionally.
  
  return (
    <TourContext.Provider value={{ isTourCompleted, completeTour }}>
      {children}
      {isClient && (
        <Joyride
          steps={TOUR_STEPS}
          run={run}
          continuous
          showProgress
          showSkipButton
          callback={handleJoyrideCallback}
          styles={{
            options: {
              arrowColor: '#0f172a', // slate-900
              backgroundColor: '#0f172a', // slate-900
              overlayColor: 'rgba(0, 0, 0, 0.7)',
              primaryColor: '#10b981', // emerald-500
              textColor: '#f8fafc', // slate-50
              zIndex: 10000,
            },
            tooltipContainer: {
              textAlign: 'left'
            },
            tooltipTitle: {
              fontSize: '18px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              color: '#34d399', // emerald-400
              marginBottom: '10px'
            },
            tooltipContent: {
              padding: '10px 0',
              fontFamily: 'Inter, sans-serif',
              color: '#cbd5e1', // slate-300
              lineHeight: 1.5,
            },
            buttonNext: {
              backgroundColor: '#10b981', // emerald-500
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
            },
            buttonBack: {
              color: '#94a3b8', // slate-400
              marginRight: '10px',
              fontFamily: 'Inter, sans-serif',
            },
            buttonSkip: {
              color: '#64748b', // slate-500
              fontFamily: 'Inter, sans-serif',
            }
          }}
        />
      )}
    </TourContext.Provider>
  );
}
