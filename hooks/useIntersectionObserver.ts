"use client";

import { useEffect, useRef, useState } from 'react';

/**
 * Preserves main-thread capacity for the Wasm pricing agent by offloading 
 * viewport-based triggers (lazy-loading, animations) to the native 
 * IntersectionObserver API.
 */
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = { threshold: 0.1, rootMargin: '100px' }
) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const callbackRef = useRef(callback);
  
  const { threshold, rootMargin, root } = options;

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting) {
        callbackRef.current();
      }
    }, { threshold, rootMargin, root });

    const currentTarget = targetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [threshold, rootMargin, root]);

  return { targetRef, isIntersecting };
}
