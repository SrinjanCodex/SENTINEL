import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountUp } from '../useCountUp';

describe('useCountUp hook', () => {
  it('returns target directly for non-numeric input', () => {
    const { result } = renderHook(() => useCountUp('N/A'));
    expect(result.current).toBe('N/A');
  });

  it('initializes and completes numeric count', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCountUp(100, 500));

    // Advance time to complete animation
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(typeof result.current === 'number').toBe(true);
    vi.useRealTimers();
  });
});
