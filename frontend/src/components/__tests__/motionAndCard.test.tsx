import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Card, StatCard } from '../ui';

describe('3D Card Depth, Tilt, and Motion System', () => {
  let matchMediaMock: any;

  beforeEach(() => {
    matchMediaMock = vi.fn().mockImplementation((query: string) => {
      if (query === '(prefers-reduced-motion: reduce)') {
        return { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
      }
      if (query === '(hover: hover) and (pointer: fine)') {
        return { matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() };
      }
      return { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    });
    window.matchMedia = matchMediaMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders standard card with base depth classes and top highlight edge', () => {
    const { container } = render(
      <Card className="test-card">
        <p>Standard Card Content</p>
      </Card>,
    );

    const card = container.querySelector('.test-card') as HTMLElement;
    expect(card).toBeDefined();
    expect(card.className).toContain('card-depth');
    expect(card.querySelector('.card-3d-sheen')).toBeNull();
  });

  it('renders hoverEffect card with card-interactive class', () => {
    const { container } = render(
      <Card hoverEffect={true} className="test-card">
        <p>Interactive Card Content</p>
      </Card>,
    );

    const card = container.querySelector('.test-card') as HTMLElement;
    expect(card.className).toContain('card-interactive');
  });

  it('renders 3D tilt card with card-3d class and reflective sheen element', () => {
    const { container } = render(
      <Card tilt3d={true} maxTilt={5} className="test-3d-card">
        <p>3D Tilted Card Content</p>
      </Card>,
    );

    const card = container.querySelector('.test-3d-card') as HTMLElement;
    expect(card.className).toContain('card-3d');

    const sheen = card.querySelector('.card-3d-sheen');
    expect(sheen).toBeDefined();
    expect(sheen?.getAttribute('aria-hidden')).toBe('true');
  });

  it('updates tilt CSS variables on pointer move and resets them on pointer leave', () => {
    const { container } = render(
      <Card tilt3d={true} maxTilt={5} className="interactive-3d">
        <p>Move and Leave Test</p>
      </Card>,
    );

    const card = container.querySelector('.interactive-3d') as HTMLElement;

    // Mock getBoundingClientRect
    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 100,
      width: 200,
      height: 100,
      right: 300,
      bottom: 200,
      x: 100,
      y: 100,
      toJSON: () => {},
    });

    // Pointer move near top right
    fireEvent(
      card,
      new MouseEvent('pointermove', {
        clientX: 250,
        clientY: 120,
        bubbles: true,
      }),
    );

    expect(card.style.getPropertyValue('--tilt-x')).toBeTruthy();
    expect(card.style.getPropertyValue('--tilt-y')).toBeTruthy();
    expect(card.style.getPropertyValue('--mouse-x')).toBe('75.0%');
    expect(card.style.getPropertyValue('--mouse-y')).toBe('20.0%');

    // Pointer leave resets tilt to rest
    fireEvent.pointerLeave(card);

    expect(card.style.getPropertyValue('--tilt-x')).toBe('0deg');
    expect(card.style.getPropertyValue('--tilt-y')).toBe('0deg');
    expect(card.style.getPropertyValue('--mouse-x')).toBe('');
  });

  it('disables tilt calculation when prefers-reduced-motion is true', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      if (query === '(prefers-reduced-motion: reduce)') {
        return { matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() };
      }
      return { matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    });

    const { container } = render(
      <Card tilt3d={true} maxTilt={5} className="reduced-card">
        <p>Reduced Motion Content</p>
      </Card>,
    );

    const card = container.querySelector('.reduced-card') as HTMLElement;
    fireEvent.pointerMove(card, { clientX: 250, clientY: 120 });

    // CSS variables should not have been set
    expect(card.style.getPropertyValue('--tilt-x')).toBe('');
  });

  it('StatCard renders with 3D tilt capability by default', () => {
    const { container } = render(
      <StatCard label="Live Incidents" value={42} sub="Active clusters" />,
    );

    const card = container.querySelector('.card-3d');
    expect(card).toBeDefined();
    expect(container.querySelector('.card-3d-sheen')).toBeDefined();
  });
});
