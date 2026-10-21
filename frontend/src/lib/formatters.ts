/** Format helpers used across the application. */

/** Format an ISO 8601 string as a human-readable local date+time. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return 'Not provided';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format just the date part. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'Not provided';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Return a relative time string ("2 hours ago", "3 days ago"). */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return 'Unknown';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hr ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} days ago`;
  return formatDate(iso);
}

/** Display coordinates as a rounded string. */
export function formatCoords(
  lat: number | null | undefined,
  lng: number | null | undefined,
): string {
  if (lat == null || lng == null) return 'Not provided';
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

/** Severity label. */
export function severityLabel(s: number | null | undefined): string {
  if (s == null) return 'Not provided';
  const labels: Record<number, string> = {
    1: '1 – Minor',
    2: '2 – Low',
    3: '3 – Moderate',
    4: '4 – High',
    5: '5 – Severe',
  };
  return labels[s] ?? String(s);
}
