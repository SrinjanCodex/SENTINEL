/**
 * SENTINEL — Unified GIS Tile Layer with Safe Fallback & Error Alerts
 * Renders the active map tile provider and automatically recovers to OpenStreetMap
 * if custom or keyed tiles fail to load or are rejected by the provider.
 */
import { useState, useCallback, useMemo } from 'react';
import { TileLayer } from 'react-leaflet';
import { AlertCircle, X } from 'lucide-react';
import { resolveTileConfig, OSM_TILE_URL, OSM_ATTRIBUTION } from '../lib/mapConfig';

export function SentinelTileLayer() {
  const initialConfig = useMemo(() => resolveTileConfig(), []);

  const [currentUrl, setCurrentUrl] = useState(initialConfig.tileUrl);
  const [currentAttr, setCurrentAttr] = useState(initialConfig.attribution);
  const [currentSubdomains, setCurrentSubdomains] = useState(initialConfig.subdomains || 'abc');
  const [hasFallenBack, setHasFallenBack] = useState(initialConfig.isFallback);
  const [notice, setNotice] = useState<string | null>(
    initialConfig.isFallback ? (initialConfig.fallbackReason ?? null) : null,
  );

  const handleTileError = useCallback(() => {
    if (currentUrl !== OSM_TILE_URL && !hasFallenBack) {
      console.warn(
        `[SENTINEL Map] Tile request failed for "${currentUrl}". Falling back to OpenStreetMap standard tiles.`,
      );
      setCurrentUrl(OSM_TILE_URL);
      setCurrentAttr(OSM_ATTRIBUTION);
      setCurrentSubdomains('abc');
      setHasFallenBack(true);
      setNotice(
        'Configured map tiles could not be loaded. Displaying standard OpenStreetMap layer.',
      );
    } else {
      setNotice('Map tiles could not be loaded. Please check your network connection.');
    }
  }, [currentUrl, hasFallenBack]);

  return (
    <>
      <TileLayer
        key={currentUrl}
        url={currentUrl}
        attribution={currentAttr}
        subdomains={currentSubdomains || 'abc'}
        maxZoom={19}
        eventHandlers={{
          tileerror: handleTileError,
        }}
      />

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="absolute top-3 right-3 z-[1000] max-w-sm bg-slate-900/95 text-slate-100 text-[11px] sm:text-xs px-3 py-2 rounded-lg shadow-lg border border-slate-700/80 backdrop-blur-xs flex items-center gap-2 pointer-events-auto animate-fade-in"
        >
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="leading-snug flex-1">{notice}</span>
          <button
            onClick={() => setNotice(null)}
            className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Dismiss map notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
