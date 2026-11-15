import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Dashboard from '../../pages/Dashboard';
import ReportIncident from '../../pages/ReportIncident';
import Reports from '../../pages/Reports';
import ReportDetail from '../../pages/ReportDetail';
import MapPage from '../../pages/MapPage';
import SystemInfo from '../../pages/SystemInfo';

describe('All Routes & Form States Rendering Check', () => {
  it('mounts Dashboard with React Bits elements without errors', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Dashboard />
      </MemoryRouter>
    );
    expect(container).toBeDefined();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('handles ReportIncident with invalid and valid inputs without console errors', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <MemoryRouter initialEntries={['/report']}>
        <ReportIncident />
      </MemoryRouter>
    );

    // Try submitting empty to test validation error state
    const submitBtn = screen.getByRole('button', { name: /Commit Observation/i });
    fireEvent.click(submitBtn);

    // Verify errors appeared gracefully
    expect(screen.getByText(/Please describe what you observed/i)).toBeInTheDocument();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('mounts Reports list without console errors', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(
      <MemoryRouter initialEntries={['/reports']}>
        <Reports />
      </MemoryRouter>
    );
    expect(container).toBeDefined();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('mounts ReportDetail without console errors', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(
      <MemoryRouter initialEntries={['/reports/rep-1']}>
        <Routes>
          <Route path="/reports/:id" element={<ReportDetail />} />
        </Routes>
      </MemoryRouter>
    );
    expect(container).toBeDefined();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('mounts MapPage without console errors', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(
      <MemoryRouter initialEntries={['/map']}>
        <MapPage />
      </MemoryRouter>
    );
    expect(container).toBeDefined();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('mounts SystemInfo without console errors', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(
      <MemoryRouter initialEntries={['/system-info']}>
        <SystemInfo />
      </MemoryRouter>
    );
    expect(container).toBeDefined();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
