"""
SENTINEL — Geospatial Subsystem
Provides Haversine distance, spatial decay, multi-factor matching, and incident clustering.
"""
from app.geospatial.haversine import (
    calculate_bounding_radius,
    calculate_centroid,
    haversine_distance,
    spatial_decay,
)
from app.geospatial.matching import (
    category_compatibility,
    compute_pair_match,
    time_decay,
)
from app.geospatial.clustering import cluster_reports

__all__ = [
    "haversine_distance",
    "spatial_decay",
    "calculate_centroid",
    "calculate_bounding_radius",
    "time_decay",
    "category_compatibility",
    "compute_pair_match",
    "cluster_reports",
]
