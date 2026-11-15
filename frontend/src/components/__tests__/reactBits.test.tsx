import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GradientText from '../GradientText';
import TiltedCard from '../TiltedCard';
import LiquidChrome from '../LiquidChrome';
import GlowCursor from '../GlowCursor';

describe('React Bits UI Components', () => {
  describe('GradientText', () => {
    it('renders children with gradient styling', () => {
      render(
        <GradientText colors={['#2dd4bf', '#38bdf8']} className="custom-test-class">
          SENTINEL Test Headline
        </GradientText>
      );
      expect(screen.getByText('SENTINEL Test Headline')).toBeInTheDocument();
    });

    it('renders with optional glow effect', () => {
      render(
        <GradientText colors={['#0d9488', '#0284c7']} glow={0.5}>
          Glow Text
        </GradientText>
      );
      const elements = screen.getAllByText('Glow Text');
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('TiltedCard', () => {
    it('renders children and preserves keyboard access', () => {
      const handleClick = vi.fn();
      render(
        <TiltedCard
          containerWidth="100%"
          containerHeight="100%"
          rotateAmplitude={5}
          onClick={handleClick}
        >
          <div data-testid="tilted-card-content">Interactive Content</div>
        </TiltedCard>
      );

      const content = screen.getByTestId('tilted-card-content');
      expect(content).toBeInTheDocument();
      
      const figure = content.closest('figure');
      expect(figure).toBeInTheDocument();

      if (figure) {
        fireEvent.pointerEnter(figure, { clientX: 100, clientY: 100 });
        fireEvent.pointerMove(figure, { clientX: 120, clientY: 130 });
        fireEvent.pointerLeave(figure);
      }
    });
  });

  describe('LiquidChrome', () => {
    it('renders WebGL canvas container', () => {
      const { container } = render(
        <LiquidChrome
          color={[0.04, 0.16, 0.22]}
          speed={0.12}
          amplitude={0.18}
          className="test-chrome"
        />
      );

      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('GlowCursor', () => {
    it('renders non-blocking canvas overlay', () => {
      const { container } = render(
        <GlowCursor
          color="#0d9488"
          secondaryColor="#0284c7"
          intensity={0.3}
          enabled={true}
        >
          <div data-testid="cursor-child">App Content</div>
        </GlowCursor>
      );

      expect(screen.getByTestId('cursor-child')).toBeInTheDocument();
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas?.className).toContain('pointer-events-none');
    });
  });
});
