import React, { useId } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  isPending: boolean;
}

/**
 * Orchestrates catalog filtering with support for React Concurrent rendering 
 * and WCAG 2.1 AA accessibility triggers. Synchronizes visual pending 
 * states with deferred transition cycles to maintain interface fluidity 
 * during high-cardinality search operations.
 */
export function SearchBar({ value, onChange, isPending }: SearchBarProps) {
  const id = useId();
  return (
    <div className="relative w-full max-w-2xl mx-auto mb-10 group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors duration-300" aria-hidden="true">
          search
        </span>
      </div>
      <label htmlFor={id} className="sr-only">Search sustainable products</label>
      <input
        id={id}
        type="text"
        className="block w-full pl-12 pr-14 py-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm hover:shadow-md focus:shadow-lg"
        placeholder="Search sustainable products..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search products"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-12 flex items-center px-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-label="Clear search"
        >
          <span className="material-symbols-outlined text-sm" aria-hidden="true">close</span>
        </button>
      )}
      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
        {isPending ? (
          <span className="material-symbols-outlined text-primary animate-spin" aria-hidden="true">
            progress_activity
          </span>
        ) : (
          <span className="w-6 h-6" />
        )}
      </div>
    </div>
  );
}
