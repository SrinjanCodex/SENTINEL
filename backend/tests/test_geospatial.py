"""
SENTINEL — Geospatial Subsystem Unit & Integration Tests
Tests Haversine distance, spatial decay, pair matching, clustering, and API endpoints.
"""
from datetime import datetime, timezone, timedelta
from app.geospatial.haversine import (
    haversine_distance,
    spatial_decay,
    calculate_centroid,
    calculate_bounding_radius,
)
from app.geospatial.matching import (
    time_decay,
    category_compatibility,
    compute_pair_match,
)


def test_haversine_known_distances():
    # Same point
    assert haversine_distance(22.5529, 88.3534, 22.5529, 88.3534) == 0.0

    # Symmetry
    d1 = haversine_distance(22.5529, 88.3534, 22.5744, 88.3639)
    d2 = haversine_distance(22.5744, 88.3639, 22.5529, 88.3534)
    assert abs(d1 - d2) < 0.001

    # Kolkata Park Street to College Street is ~2.6 km (between 2300m and 2900m)
    assert 2300 < d1 < 2900


def test_spatial_decay():
    assert spatial_decay(0.0, radius_meters=300.0) == 1.0
    assert spatial_decay(300.0, radius_meters=300.0) == 0.0
    assert spatial_decay(400.0, radius_meters=300.0) == 0.0
    assert abs(spatial_decay(150.0, radius_meters=300.0) - 0.5) < 0.01


def test_calculate_centroid_and_radius():
    points = [(22.5, 88.3), (22.6, 88.4)]
    c_lat, c_lon = calculate_centroid(points)
    assert abs(c_lat - 22.55) < 1e-6
    assert abs(c_lon - 88.35) < 1e-6

    radius = calculate_bounding_radius(c_lat, c_lon, points)
    assert radius > 50.0


def test_time_decay_and_category_compat():
    now = datetime.now(timezone.utc)
    t_1h = now - timedelta(hours=1)
    t_80h = now - timedelta(hours=80)

    assert time_decay(now, now) == 1.0
    assert time_decay(now, t_1h) > 0.95
    assert time_decay(now, t_80h) == 0.0
    assert time_decay(None, now) == 0.5

    assert category_compatibility("roadway_flooding", "roadway_flooding") == 1.0
    assert category_compatibility("roadway_flooding", "persistent_standing_water") == 0.6
    assert category_compatibility("roadway_flooding", "uncertain") == 0.4
    assert category_compatibility("roadway_flooding", "random_unrelated") == 0.2


def test_compute_pair_match():
    class MockReport:
        def __init__(self, desc, lat, lon, cat, dt):
            self.original_description = desc
            self.latitude = lat
            self.longitude = lon
            self.category = cat
            self.observed_at = dt
            self.submitted_at = dt

    now = datetime.now(timezone.utc)
    r1 = MockReport("Severe road flooding near Park Street metro", 22.5529, 88.3534, "roadway_flooding", now)
    # Nearby, same category, similar text
    r2 = MockReport("Waterlogged road outside Park Street station", 22.5532, 88.3536, "roadway_flooding", now)
    # Distant report
    r3 = MockReport("Salt Lake sector V water accumulation", 22.5800, 88.4300, "roadway_flooding", now)

    score_close, reasons_close, is_ind = compute_pair_match(r1, r2)
    assert score_close >= 0.60
    assert reasons_close["distance_meters"] is not None
    assert reasons_close["distance_meters"] < 100.0

    score_far, reasons_far, _ = compute_pair_match(r1, r3)
    assert score_far < score_close
    assert reasons_far["geographic_compatibility"] == 0.0


def test_clustering_api_endpoints(client):
    # 1. Create two nearby reports
    rep1_data = {
        "original_description": "Knee-deep water outside College Street bookstore",
        "latitude": 22.5744,
        "longitude": 88.3639,
        "address": "College Street, Kolkata",
    }
    rep2_data = {
        "original_description": "Water logging in front of College Street university gate",
        "latitude": 22.5748,
        "longitude": 88.3642,
        "address": "College Street, Kolkata",
    }
    r1 = client.post("/api/reports", json=rep1_data).json()
    r2 = client.post("/api/reports", json=rep2_data).json()

    # 2. Trigger clustering endpoint
    cluster_resp = client.post("/api/incidents/cluster")
    assert cluster_resp.status_code == 200
    cluster_data = cluster_resp.json()
    assert cluster_data["status"] == "success"
    assert cluster_data["clusters_count"] >= 1

    # 3. Verify /api/analysis/run alias
    run_resp = client.post("/api/analysis/run")
    assert run_resp.status_code == 200
    assert run_resp.json()["status"] == "success"

    # 4. List incidents
    inc_list = client.get("/api/incidents").json()
    assert inc_list["total"] >= 1
    target_inc_id = cluster_data["incident_ids"][0]

    # 5. Get incident detail
    detail = client.get(f"/api/incidents/{target_inc_id}").json()
    assert detail["id"] == target_inc_id
    assert "linked_reports" in detail
    assert len(detail["linked_reports"]) >= 1
    linked_first = detail["linked_reports"][0]
    assert "distance_from_centroid_meters" in linked_first
    assert linked_first["category"] is not None
