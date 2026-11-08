/**
 * SENTINEL — Ambient Decorative Floating Tiles
 * Abstract geometric wireframe tiles drifting subtly in page backgrounds.
 * Fully decoupled from data: strictly aria-hidden, pointer-events: none,
 * automatically pauses on tab blur, and strictly respects prefers-reduced-motion.
 */
import { useEffect, useState } from 'react';

interface FloatingTilesProps {
  count?: number;
  className?: string;
}

export function FloatingTiles({ count = 6, className = '' }: FloatingTilesProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    // Detect user's reduced-motion preference changes
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
  }, []);

  useEffect(() => {
    // 2. Pause animations when the browser tab is hidden to save GPU/CPU cycles
    const handleVisibilityChange = () => {
      setIsPaused(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (reducedMotion) {
    return null;
  }

  // 6 deterministic geometric wireframe tiles
  const TILES = [
    {
      top: '12%',
      left: '8%',
      size: 'w-24 h-24',
      anim: 'floatDrift1',
      duration: '18s',
      delay: '0s',
      content: (
        <div className="w-full h-full rounded-2xl border border-slate-300/40 bg-slate-200/10 p-2">
          <div className="w-full h-full border border-dashed border-teal-500/20 rounded-xl flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500/30" />
          </div>
        </div>
      ),
    },
    {
      top: '22%',
      right: '10%',
      size: 'w-28 h-28',
      anim: 'floatDrift2',
      duration: '22s',
      delay: '-4s',
      content: (
        <div className="w-full h-full rounded-2xl border border-slate-300/50 bg-white/20 p-2.5">
          <div className="w-full h-full rounded-lg bg-gradient-to-br from-teal-500/10 to-transparent flex flex-col justify-between p-2">
            <div className="flex justify-between">
              <span className="w-1 h-1 rounded-full bg-slate-400/30" />
              <span className="w-1 h-1 rounded-full bg-slate-400/30" />
            </div>
            <div className="flex justify-between">
              <span className="w-1 h-1 rounded-full bg-slate-400/30" />
              <span className="w-1 h-1 rounded-full bg-slate-400/30" />
            </div>
          </div>
        </div>
      ),
    },
    {
      top: '60%',
      left: '4%',
      size: 'w-20 h-20',
      anim: 'floatDrift3',
      duration: '16s',
      delay: '-2s',
      content: (
        <div className="w-full h-full rounded-xl border border-slate-400/30 bg-slate-100/20 p-1.5">
          <div className="w-full h-full border border-teal-500/20 rounded-md" />
        </div>
      ),
    },
    {
      top: '55%',
      right: '6%',
      size: 'w-32 h-20',
      anim: 'floatDrift1',
      duration: '25s',
      delay: '-6s',
      content: (
        <div className="w-full h-full rounded-xl border border-slate-300/40 bg-white/10 p-2 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-sm border border-slate-400/30" />
          <div className="w-6 h-0.5 bg-slate-300/40 rounded-full" />
          <div className="w-2 h-2 rounded-full border border-teal-500/30" />
        </div>
      ),
    },
    {
      top: '78%',
      left: '18%',
      size: 'w-16 h-16',
      anim: 'floatDrift2',
      duration: '20s',
      delay: '-8s',
      content: (
        <div className="w-full h-full rounded-lg border border-dashed border-slate-400/30 p-1">
          <div className="w-full h-full rounded bg-slate-200/20" />
        </div>
      ),
    },
    {
      top: '15%',
      left: '52%',
      size: 'w-20 h-20',
      anim: 'floatDrift3',
      duration: '24s',
      delay: '-10s',
      content: (
        <div className="w-full h-full rounded-2xl border border-teal-500/20 bg-teal-50/10 p-2">
          <div className="w-full h-full rounded-xl border border-slate-300/30 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full border border-teal-500/40" />
          </div>
        </div>
      ),
    },
  ];

  const visibleTiles = TILES.slice(0, count);

  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {visibleTiles.map((tile, i) => (
        <div
          key={i}
          className={`absolute ${tile.size} transition-opacity duration-500`}
          style={{
            top: tile.top,
            left: tile.left,
            right: tile.right,
            animation: `${tile.anim} ${tile.duration} ease-in-out infinite`,
            animationDelay: tile.delay,
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {tile.content}
        </div>
      ))}
    </div>
  );
}
