'use client';

import { useRouter } from 'next/navigation';

export function BackButton() {
  const router = useRouter();

  return (
    <button 
      onClick={() => router.back()} 
      className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors tracking-widest uppercase mb-10 w-fit"
    >
      <span className="material-symbols-outlined text-lg">arrow_back</span>
      Back to Catalog
    </button>
  );
}
