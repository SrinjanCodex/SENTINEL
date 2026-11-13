/**
 * SENTINEL — API client factory
 *
 * Pages import getApiClient() from here. They NEVER import MockApiClient or
 * RealApiClient directly. This makes it trivial to switch implementations:
 * in Milestone 2, when VITE_USE_MOCK_API=false, the real client is returned.
 */
import type { ApiClient } from '../types';
import { MockApiClient } from './mockClient';
import { RealApiClient } from './realClient';

// Singleton instance — one client per browser session
let _client: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (_client) return _client;

  const useMock = import.meta.env.VITE_USE_MOCK_API !== 'false';
  if (useMock) {
    _client = new MockApiClient();
  } else {
    _client = new RealApiClient();
  }

  return _client;
}

export * from './pagination';

