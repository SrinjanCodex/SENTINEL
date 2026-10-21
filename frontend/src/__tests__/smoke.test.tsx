import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
import { ErrorBoundary, MapErrorBoundary } from '../components/ErrorBoundary';

function BuggyComponent(): never {
  throw new Error('Simulated component crash');
}

describe('Application Stability & Error Boundaries', () => {
  it('renders root App without throwing uncaught exceptions', () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it('catches crashes gracefully with application-level ErrorBoundary', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallbackTitle="Custom Crash Title">
        <BuggyComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Custom Crash Title')).toBeDefined();
    expect(screen.getByText('Simulated component crash')).toBeDefined();
    expect(screen.getByText('Reload Application')).toBeDefined();

    spy.mockRestore();
  });

  it('isolates map crashes with MapErrorBoundary', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MapErrorBoundary height="340px">
        <BuggyComponent />
      </MapErrorBoundary>,
    );

    expect(screen.getByRole('region')).toBeDefined();
    expect(screen.getByText('Spatial Telemetry Map Unavailable')).toBeDefined();
    expect(screen.getByText('Retry Map')).toBeDefined();

    spy.mockRestore();
  });
});
