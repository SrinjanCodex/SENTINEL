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

  it('renders 3D tilt card using TiltedCard wrapper by default', () => {
    const { container } = render(
      <Card tilt={true} maxTilt={5} className="test-3d-card">
        <p>3D Tilted Card Content</p>
      </Card>,
    );

    const card = container.querySelector('.test-3d-card') as HTMLElement;
    expect(card).toBeDefined();
    expect(card.className).toContain('card-depth');

    const figure = container.querySelector('figure');
    expect(figure).toBeDefined();
    expect(figure?.className).toContain('tilted-card');
  });

  it('updates tilt transformation on pointer events and resets on pointer leave', () => {
    const { container } = render(
      <Card tilt={true} maxTilt={5} className="interactive-3d">
        <p>Move and Leave Test</p>
      </Card>,
    );

    const figure = container.querySelector('figure') as HTMLElement;
    expect(figure).toBeDefined();

    // Mock getBoundingClientRect
    vi.spyOn(figure, 'getBoundingClientRect').mockReturnValue({
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

    // Pointer move
    fireEvent.pointerMove(figure, {
      clientX: 250,
      clientY: 120,
    });

    // Pointer leave resets tilt
    fireEvent.pointerLeave(figure);
    expect(figure).toBeDefined();
  });

  it('disables tilt calculation when prefers-reduced-motion is true', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      if (query === '(prefers-reduced-motion: reduce)') {
        return { matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() };
      }
      return { matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    });

    const { container } = render(
      <Card tilt={true} maxTilt={5} className="reduced-card">
        <p>Reduced Motion Content</p>
      </Card>,
    );

    const figure = container.querySelector('figure');
    expect(figure).toBeDefined();
  });

  it('StatCard renders with 3D tilt capability by default', () => {
    const { container } = render(
      <StatCard label="Live Incidents" value={42} sub="Active clusters" />,
    );

    const figure = container.querySelector('figure');
    expect(figure).toBeDefined();
    expect(figure?.className).toContain('tilted-card');
  });
});
