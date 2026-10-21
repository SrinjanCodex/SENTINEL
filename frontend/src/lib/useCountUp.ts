/**
 * SENTINEL — Lightweight count-up animation hook
 * Animates numerical statistics smoothly with ease-out cubic timing.
 * Automatically respects `prefers-reduced-motion`.
 */
import { useEffect, useState } from 'react';

export function useCountUp(target: number | string, duration: number = 700): number | string {
  const numericTarget = typeof target === 'number' ? target : parseInt(target, 10);
  const isNumeric = !isNaN(numericTarget);

  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!isNumeric) return;

    // Respect user's motion preference
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setCount(numericTarget);
      return;
    }

    if (numericTarget === 0) {
      setCount(0);
      return;
    }

    const startTime = performance.now();

    function update(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic curve
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(easeOut * numericTarget));

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    const frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [numericTarget, duration, isNumeric]);

  if (!isNumeric) return target;
  return count;
}
