"""
SENTINEL — Geospatial Distance & Geometry Calculations
Implements the Haversine formula, spatial decay, and centroid calculations.
"""
import math
from typing import List, Tuple

# Mean Earth radius in meters (WGS84 spherical approximation)
EARTH_RADIUS_METERS = 6371000.0


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two GPS coordinates in meters.
    """
    if lat1 == lat2 and lon1 == lon2:
        return 0.0

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    # Clamp to avoid precision domain errors with atan2/sqrt
    a = min(1.0, max(0.0, a))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return EARTH_RADIUS_METERS * c


def spatial_decay(distance_meters: float, radius_meters: float = 300.0) -> float:
    """
    Computes geographic compatibility in [0.0, 1.0].
    Decays linearly from 1.0 at 0m to 0.0 at radius_meters.
    """
    if distance_meters <= 0.0:
        return 1.0
    if distance_meters >= radius_meters:
        return 0.0
    return max(0.0, min(1.0, 1.0 - (distance_meters / radius_meters)))


def calculate_centroid(points: List[Tuple[float, float]]) -> Tuple[float, float]:
    """
    Computes geographic centroid (mean lat, mean lon) for a list of coordinates.
    """
    if not points:
        raise ValueError("Cannot calculate centroid of empty points list.")
    total_lat = sum(p[0] for p in points)
    total_lon = sum(p[1] for p in points)
    n = len(points)
    return (total_lat / n, total_lon / n)


def calculate_bounding_radius(
    centroid_lat: float,
    centroid_lon: float,
    points: List[Tuple[float, float]],
    min_radius: float = 50.0,
) -> float:
    """
    Computes maximum distance from centroid to any member point in meters.
    Guarantees at least min_radius meters.
    """
    if not points:
        return min_radius
    max_dist = max(
        haversine_distance(centroid_lat, centroid_lon, p[0], p[1])
        for p in points
    )
    return max(min_radius, max_dist)
