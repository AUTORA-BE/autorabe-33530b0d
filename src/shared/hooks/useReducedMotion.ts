/**
 * Hook to detect user's prefers-reduced-motion setting
 * @module shared/hooks/useReducedMotion
 */

import { useState, useEffect } from 'react';

/**
 * Returns true if the user prefers reduced motion.
 * Use to conditionally disable Framer Motion animations.
 *
 * @example
 * ```tsx
 * const prefersReduced = useReducedMotion();
 * <motion.div animate={prefersReduced ? {} : { opacity: 1, y: 0 }} />
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

export default useReducedMotion;
