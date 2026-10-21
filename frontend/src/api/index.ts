/**
 * SENTINEL — API client factory
 *
 * Pages import getApiClient() from here. They NEVER import MockApiClient or
 * RealApiClient directly. This makes it trivial to switch implementations:
 * in Milestone 2, when VITE_USE_MOCK_API=false, the real client is returned.
 */
import type { ApiClient } from '../types';
import { MockApiClient } from './mockClient';

// Singleton instance — one client per browser session
let _client: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (_client) return _client;

  const useMock = import.meta.env.VITE_USE_MOCK_API !== 'false';
  if (useMock) {
    _client = new MockApiClient();
  } else {
    // Milestone 2: import RealApiClient dynamically when the env var is false
    // For now, fall back to mock with a console notice
    console.info(
      '[SENTINEL] VITE_USE_MOCK_API is false but RealApiClient is not yet ' +
      'implemented. Falling back to MockApiClient. ' +
      'Connect the backend in Milestone 2.',
    );
    _client = new MockApiClient();
  }

  return _client;
}
