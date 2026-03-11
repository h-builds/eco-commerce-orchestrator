"use client";

import { useEffect, useRef, useState } from 'react';

/**
 * A lightweight custom hook utilizing IntersectionObserver to trigger a callback
 * when the attached element enters the viewport.
 */
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = { threshold: 0.1, rootMargin: '100px' }
) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const callbackRef = useRef(callback);
  
  // Destructure options to safely use in dependency array
  const { threshold, rootMargin, root } = options;

  // Keep callback reference up to date to avoid running stale closures
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
