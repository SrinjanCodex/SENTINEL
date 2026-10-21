import { describe, it, expect } from 'vitest';
import { resolveTileConfig, OSM_TILE_URL, OSM_ATTRIBUTION } from '../mapConfig';

describe('mapConfig - resolveTileConfig', () => {
  it('defaults to standard OpenStreetMap when no env URL is provided', () => {
    const config = resolveTileConfig('', '', '');
    expect(config.tileUrl).toBe(OSM_TILE_URL);
    expect(config.attribution).toBe(OSM_ATTRIBUTION);
    expect(config.subdomains).toBe('abc');
    expect(config.isCustom).toBe(false);
    expect(config.isFallback).toBe(false);
  });

  it('safely falls back to OSM when CARTO is configured without an API key', () => {
    const cartoUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
    const config = resolveTileConfig(cartoUrl, '', '');
    expect(config.tileUrl).toBe(OSM_TILE_URL);
    expect(config.attribution).toBe(OSM_ATTRIBUTION);
    expect(config.isFallback).toBe(true);
    expect(config.fallbackReason).toContain('API key');
  });

  it('safely falls back to OSM when MapTiler is configured without an API key', () => {
    const maptilerUrl = 'https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png';
    const config = resolveTileConfig(maptilerUrl, '', '');
    expect(config.tileUrl).toBe(OSM_TILE_URL);
    expect(config.isFallback).toBe(true);
  });

  it('interpolates {apiKey} placeholder when API key is provided', () => {
    const template = 'https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key={apiKey}';
    const config = resolveTileConfig(template, 'MapTiler Custom Attr', 'test_secret_123');
    expect(config.tileUrl).toBe('https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=test_secret_123');
    expect(config.attribution).toBe('MapTiler Custom Attr');
    expect(config.isCustom).toBe(true);
    expect(config.isFallback).toBe(false);
  });

  it('automatically appends api_key parameter for CARTO when key is provided', () => {
    const cartoUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
    const config = resolveTileConfig(cartoUrl, 'CARTO & OSM', 'carto_key_abc');
    expect(config.tileUrl).toBe(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?api_key=carto_key_abc',
    );
    expect(config.subdomains).toBe('abcd');
    expect(config.isCustom).toBe(true);
  });

  it('preserves existing query parameters when appending api_key', () => {
    const cartoUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?scale=2';
    const config = resolveTileConfig(cartoUrl, 'CARTO & OSM', 'carto_key_abc');
    expect(config.tileUrl).toBe(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?scale=2&api_key=carto_key_abc',
    );
  });

  it('accepts a custom independent tile server with custom attribution', () => {
    const customUrl = 'https://tiles.example.org/{z}/{x}/{y}.png';
    const customAttr = 'Custom Tile Server Attribution';
    const config = resolveTileConfig(customUrl, customAttr, '');
    expect(config.tileUrl).toBe(customUrl);
    expect(config.attribution).toBe(customAttr);
    expect(config.isCustom).toBe(true);
    expect(config.isFallback).toBe(false);
  });
});
