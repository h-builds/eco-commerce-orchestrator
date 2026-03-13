'use client';

import { useEffect, useCallback, useSyncExternalStore } from 'react';
import { DebugConsole } from '@/components/organisms/DebugConsole';

const STORAGE_KEY = 'isConsoleOpen';

/**
 * Synchronizes external DOM storage events. Dispatched manual 'storage' 
 * events for same-tab mutations to bypass the native browser limitation 
 * where storage listeners only trigger across instances.
 */
function subscribeToStorage(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshot(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function getServerSnapshot(): boolean {
  return false;
}

function writeStorage(value: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(value));
  window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
}

/**
 * Hydration-safe bridge for the telemetry console. Utilizes 'useSyncExternalStore' 
 * to derive state from localStorage without triggering SSR mismatches or 
 * layout shifts during Worker-side execution.
 */
export function DebugBridge() {
  const isConsoleOpen = useSyncExternalStore(
    subscribeToStorage,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        writeStorage(!getSnapshot());
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const setConsoleOpen = useCallback((open: boolean) => {
    writeStorage(open);
  }, []);

  return (
    <DebugConsole isConsoleOpen={isConsoleOpen} setConsoleOpen={setConsoleOpen} />
  );
}
