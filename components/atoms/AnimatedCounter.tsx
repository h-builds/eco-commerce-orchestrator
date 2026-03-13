'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
}

/**
 * High-frequency value tweening via Motion springs. Decouples numerical 
 * interpolation from the React reconciliation loop to preserve main-thread 
 * performance under aggressive simulation loads.
 */
export function AnimatedCounter({ value, decimals = 0 }: AnimatedCounterProps) {
  const spring = useSpring(value, {
    bounce: 0,
    duration: 800,
  });
  
  const display = useTransform(spring, (current) => current.toFixed(decimals));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}
