/**
 * SENTINEL — GIS Map Tile Configuration & Provider Resolution
 * Manages tile URLs, attributions, optional API key interpolation, and safe OSM fallbacks.
 */

export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

export interface ResolvedTileConfig {
  tileUrl: string;
  attribution: string;
  subdomains?: string;
  maxZoom: number;
  isCustom: boolean;
  isFallback: boolean;
  fallbackReason?: string;
}

/**
 * Resolves the active tile URL and attribution based on environment variables.
 * If no key is set for providers requiring one (e.g. CARTO, MapTiler, Stadia),
 * safely falls back to standard OpenStreetMap to prevent watermarked or broken tiles.
 */
export function resolveTileConfig(
  envUrl?: string,
  envAttr?: string,
  envKey?: string,
): ResolvedTileConfig {
  const rawUrl = (envUrl ?? import.meta.env.VITE_MAP_TILE_URL ?? '').trim();
  const rawAttr = (envAttr ?? import.meta.env.VITE_MAP_ATTRIBUTION ?? '').trim();
  const rawKey = (envKey ?? import.meta.env.VITE_MAP_API_KEY ?? '').trim();

  // 1. Default: If no custom URL is configured, use standard OpenStreetMap
  if (!rawUrl || rawUrl === OSM_TILE_URL) {
    return {
      tileUrl: OSM_TILE_URL,
      attribution: rawAttr || OSM_ATTRIBUTION,
      maxZoom: 19,
      isCustom: false,
      isFallback: false,
    };
  }

  const isCarto = rawUrl.includes('cartocdn.com');
  const isMapTiler = rawUrl.includes('maptiler.com');
  const isStadia = rawUrl.includes('stadiamaps.com');
  const hasKeyParam = /[?&](key|api_key)=/i.test(rawUrl);

  // 2. Safeguard: Key-requiring provider specified without an API key
  if ((isCarto || isMapTiler || isStadia) && !hasKeyParam && !rawKey) {
    return {
      tileUrl: OSM_TILE_URL,
      attribution: OSM_ATTRIBUTION,
      maxZoom: 19,
      isCustom: false,
      isFallback: true,
      fallbackReason:
        'Configured provider requires an API key, but VITE_MAP_API_KEY is not set. Reverted to standard OpenStreetMap.',
    };
  }

  // 3. Interpolate API key if provided
  let resolvedUrl = rawUrl;
  if (rawKey) {
    if (resolvedUrl.includes('{apiKey}')) {
      resolvedUrl = resolvedUrl.replace(/\{apiKey\}/g, rawKey);
    } else if (resolvedUrl.includes('{key}')) {
      resolvedUrl = resolvedUrl.replace(/\{key\}/g, rawKey);
    } else if (!hasKeyParam) {
      const sep = resolvedUrl.includes('?') ? '&' : '?';
      if (isCarto || isStadia) {
        resolvedUrl = `${resolvedUrl}${sep}api_key=${encodeURIComponent(rawKey)}`;
      } else {
        resolvedUrl = `${resolvedUrl}${sep}key=${encodeURIComponent(rawKey)}`;
      }
    }
  }

  return {
    tileUrl: resolvedUrl,
    attribution: rawAttr || OSM_ATTRIBUTION,
    subdomains: isCarto ? 'abcd' : undefined,
    maxZoom: 19,
    isCustom: true,
    isFallback: false,
  };
}
