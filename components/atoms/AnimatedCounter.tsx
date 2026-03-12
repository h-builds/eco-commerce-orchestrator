'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
}

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
