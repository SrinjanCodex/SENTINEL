/**
 * SENTINEL — Lightweight count-up animation hook
 * Animates numerical statistics smoothly with ease-out cubic timing.
 * Automatically respects `prefers-reduced-motion`.
 */
import { useEffect, useState } from 'react';

function checkReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useCountUp(target: number | string, duration: number = 700): number | string {
  const numericTarget = typeof target === 'number' ? target : parseInt(target, 10);
  const isNumeric = !isNaN(numericTarget);
  const isReduced = checkReducedMotion();

  const [count, setCount] = useState<number>(() => (isReduced && isNumeric ? numericTarget : 0));

  useEffect(() => {
    if (!isNumeric || isReduced || numericTarget === 0) {
      return;
    }

    let frameId: number;
    const startTime = performance.now();

    function update(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic curve for natural smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(easeOut * numericTarget));

      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      }
    }

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [numericTarget, duration, isNumeric, isReduced]);

  if (!isNumeric || isReduced) return target;
  return count;
}
