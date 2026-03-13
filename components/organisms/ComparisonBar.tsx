"use client";

import { useCompare } from "@/lib/CompareContext";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function ComparisonBar() {
  const { selectedProducts, clearComparison, setIsCompareModalOpen } = useCompare();

  // Only show the bar if at least 2 items are selected.
  const isVisible = selectedProducts.length >= 2;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none flex justify-center"
        >
          <div className="bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md border border-slate-700/50 shadow-2xl shadow-emerald-500/10 rounded-2xl p-4 flex items-center justify-between gap-6 pointer-events-auto max-w-3xl w-full">
            <div className="flex items-center gap-4 flex-1">
              <div className="text-white text-sm font-bold flex flex-col">
                <span>Compare Products</span>
                <span className="text-slate-400 text-xs font-normal">
                  {selectedProducts.length} of 3 selected
                </span>
              </div>
              <div className="flex gap-2">
                {selectedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-700"
                    title={product.name}
                  >
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
                {/* Empty slots */}
                {Array.from({ length: 3 - selectedProducts.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="w-10 h-10 rounded-lg border border-dashed border-slate-600 flex items-center justify-center text-slate-600 bg-slate-800/50"
                  >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">
                      add
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={clearComparison}
                className="text-slate-400 hover:text-white text-sm px-3 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 rounded-lg"
              >
                Clear
              </button>
              <button
                onClick={() => setIsCompareModalOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 px-5 rounded-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30"
              >
                <span className="material-symbols-outlined text-sm" aria-hidden="true">
                  analytics
                </span>
                Compare Now
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
