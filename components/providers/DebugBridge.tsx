'use client';

import { useEffect, useCallback, useSyncExternalStore } from 'react';
import { DebugConsole } from '@/components/organisms/DebugConsole';

const STORAGE_KEY = 'isConsoleOpen';

// ---------------------------------------------------------------------------
// useSyncExternalStore wiring for localStorage
// The `storage` event fires for other-tab changes automatically.
// For same-tab mutations we manually dispatch a StorageEvent so the snapshot
// is re-read and the UI stays in sync without calling setState inside an effect.
// ---------------------------------------------------------------------------
function subscribeToStorage(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshot(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function getServerSnapshot(): boolean {
  return false; // always start closed on the server / during SSR
}

function writeStorage(value: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(value));
  // Notify the same-tab subscription (storage events don't fire for same-tab writes)
  window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
}

export function DebugBridge() {
  const isConsoleOpen = useSyncExternalStore(
    subscribeToStorage,
    getSnapshot,
    getServerSnapshot,
  );

  // Global keyboard shortcut: Ctrl+Shift+D (Linux/Windows) or Cmd+Shift+D (Mac)
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
