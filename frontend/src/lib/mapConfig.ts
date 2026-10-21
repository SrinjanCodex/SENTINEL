/**
 * SENTINEL — GIS Map Configuration & Provider Resolution
 * Manages tile URLs, attributions, API key interpolation, India center/zoom defaults,
 * and safe OpenStreetMap fallbacks.
 */

export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

// Default India geographic center & zoom level (configurable in one place)
export const DEFAULT_MAP_CENTER: [number, number] = [
  parseFloat(import.meta.env.VITE_MAP_DEFAULT_LAT ?? '22.5'),
  parseFloat(import.meta.env.VITE_MAP_DEFAULT_LNG ?? '79.0'),
];

export const DEFAULT_MAP_ZOOM: number = parseInt(
  import.meta.env.VITE_MAP_DEFAULT_ZOOM ?? '5',
  10,
);

export const STREET_LEVEL_ZOOM = 14;

export interface ResolvedTileConfig {
  tileUrl: string;
  attribution: string;
  subdomains: string;
  maxZoom: number;
  isCustom: boolean;
  isFallback: boolean;
  isEnglish: boolean;
  fallbackReason?: string;
  notice?: string;
}

/**
 * Resolves the active tile URL, attribution, and language mode based on environment variables.
 * Safe default: Standard OpenStreetMap (centered on India).
 * If a free API key is provided (MapTiler or CARTO), enables English labels.
 */
export function resolveTileConfig(
  envUrl?: string,
  envAttr?: string,
  envKey?: string,
): ResolvedTileConfig {
  const rawUrl = (envUrl ?? import.meta.env.VITE_MAP_TILE_URL ?? '').trim();
  const rawAttr = (envAttr ?? import.meta.env.VITE_MAP_ATTRIBUTION ?? '').trim();
  const rawKey = (envKey ?? import.meta.env.VITE_MAP_API_KEY ?? '').trim();

  // 1. If an API key is provided and no custom URL was specified (or MapTiler URL specified):
  if (rawKey && (!rawUrl || rawUrl.includes('maptiler.com'))) {
    const maptilerUrl = `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${encodeURIComponent(rawKey)}&language=en`;
    const maptilerAttr =
      '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

    return {
      tileUrl: maptilerUrl,
      attribution: rawAttr || maptilerAttr,
      subdomains: 'abc',
      maxZoom: 19,
      isCustom: true,
      isFallback: false,
      isEnglish: true,
    };
  }

  // 2. If no custom URL is configured, use standard OpenStreetMap
  if (!rawUrl || rawUrl === OSM_TILE_URL) {
    return {
      tileUrl: OSM_TILE_URL,
      attribution: rawAttr || OSM_ATTRIBUTION,
      subdomains: 'abc',
      maxZoom: 19,
      isCustom: false,
      isFallback: false,
      isEnglish: false,
      notice:
        'Standard OpenStreetMap active · To enable English labels across all regions, add a free API key in .env (see README).',
    };
  }

  const isCarto = rawUrl.includes('cartocdn.com');
  const isMapTiler = rawUrl.includes('maptiler.com');
  const isStadia = rawUrl.includes('stadiamaps.com');
  const hasKeyParam = /[?&](key|api_key)=/i.test(rawUrl);

  // 3. Safeguard: Key-requiring provider specified without an API key
  if ((isCarto || isMapTiler || isStadia) && !hasKeyParam && !rawKey) {
    return {
      tileUrl: OSM_TILE_URL,
      attribution: OSM_ATTRIBUTION,
      subdomains: 'abc',
      maxZoom: 19,
      isCustom: false,
      isFallback: true,
      isEnglish: false,
      fallbackReason:
        'Configured provider requires an API key, but VITE_MAP_API_KEY is not set. Reverted to standard OpenStreetMap.',
      notice:
        'API key missing for configured provider. Displaying standard OpenStreetMap layer.',
    };
  }

  // 4. Interpolate API key if provided into custom URL
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

  // Ensure language=en for MapTiler if not already present
  if (isMapTiler && !resolvedUrl.includes('language=')) {
    resolvedUrl += (resolvedUrl.includes('?') ? '&' : '?') + 'language=en';
  }

  return {
    tileUrl: resolvedUrl,
    attribution: rawAttr || OSM_ATTRIBUTION,
    subdomains: isCarto ? 'abcd' : 'abc',
    maxZoom: 19,
    isCustom: true,
    isFallback: false,
    isEnglish: isCarto || isMapTiler || isStadia,
  };
}
