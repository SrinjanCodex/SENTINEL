"""
SENTINEL — API Endpoint Integration Tests
Tests health, stats, report creation, validation rules, pagination, filtering, and retrieval.
"""
from datetime import datetime, timezone
from app.models import Report, Incident


def test_health_check(client):
    """GET /api/health should return 200 with healthy status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert "timestamp" in data


def test_dashboard_stats_empty(client):
    """GET /api/stats should return zeroes when database is empty."""
    response = client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_reports"] == 0
    assert data["potential_incidents"] == 0
    assert data["awaiting_verification"] == 0
    assert data["high_priority_incidents"] == 0
    assert data["is_demonstration"] is True


def test_dashboard_stats_with_data(client, db_session):
    """GET /api/stats should compute accurate aggregate counts."""
    # Seed 1 real report and 1 incident
    real_report = Report(
        original_description="Waterlogged road in Salt Lake Sector V.",
        category="water_accumulation_on_roads",
        reported_severity=4,
        is_synthetic=False,
    )
    incident = Incident(
        title="Salt Lake water accumulation",
        verification_status="suspected",
        priority_score=78.5,
    )
    db_session.add(real_report)
    db_session.add(incident)
    db_session.commit()

    response = client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_reports"] == 1
    assert data["potential_incidents"] == 1
    assert data["awaiting_verification"] == 1
    assert data["high_priority_incidents"] == 1
    assert data["is_demonstration"] is False


def test_create_report_success(client):
    """POST /api/reports should create a valid report and return 201 Created."""
    payload = {
        "original_description": "Water overflowing from roadside gully pit across two lanes.",
        "reported_severity": 3,
        "address": "Park Street, Kolkata",
        "latitude": 22.5512,
        "longitude": 88.3524,
        "observed_at": "2026-10-21T09:00:00Z",
    }
    response = client.post("/api/reports", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["original_description"] == payload["original_description"]
    assert data["reported_severity"] == 3
    assert data["address"] == "Park Street, Kolkata"
    assert data["latitude"] == 22.5512
    assert data["longitude"] == 88.3524
    assert data["status"] == "unverified"
    assert data["category"] == "uncertain"
    assert data["category_uncertain"] is True
    assert data["is_synthetic"] is False
    assert len(data["reporter_token"]) > 0


def test_create_report_validation_errors(client):
    """POST /api/reports should reject invalid payloads with 422 and clear error messages."""
    # Description too short (<10 chars)
    resp1 = client.post("/api/reports", json={"original_description": "short"})
    assert resp1.status_code == 422
    data1 = resp1.json()
    assert "detail" in data1
    assert any("description" in err["field"].lower() for err in data1["errors"])

    # Invalid latitude (> 90.0)
    resp2 = client.post(
        "/api/reports",
        json={
            "original_description": "Valid description describing waterlogging condition.",
            "latitude": 95.5,
        },
    )
    assert resp2.status_code == 422
    data2 = resp2.json()
    assert any("latitude" in err["field"].lower() for err in data2["errors"])

    # Invalid severity (> 5)
    resp3 = client.post(
        "/api/reports",
        json={
            "original_description": "Valid description describing waterlogging condition.",
            "reported_severity": 10,
        },
    )
    assert resp3.status_code == 422
    data3 = resp3.json()
    assert any("reported_severity" in err["field"].lower() for err in data3["errors"])


def test_list_reports_pagination(client, db_session):
    """GET /api/reports should paginate results correctly."""
    for i in range(15):
        rep = Report(
            original_description=f"Automated test report number {i+1} with sufficient length.",
            category="persistent_standing_water",
            status="unverified",
        )
        db_session.add(rep)
    db_session.commit()

    # Page 1, limit 10
    resp_p1 = client.get("/api/reports?page=1&per_page=10")
    assert resp_p1.status_code == 200
    data_p1 = resp_p1.json()
    assert data_p1["total"] == 15
    assert len(data_p1["items"]) == 10
    assert data_p1["page"] == 1
    assert data_p1["per_page"] == 10

    # Page 2, limit 10
    resp_p2 = client.get("/api/reports?page=2&per_page=10")
    assert resp_p2.status_code == 200
    data_p2 = resp_p2.json()
    assert len(data_p2["items"]) == 5
    assert data_p2["page"] == 2


def test_list_reports_search_and_filter(client, db_session):
    """GET /api/reports should filter by category and search keyword."""
    r1 = Report(
        original_description="Severe inundation near College Street library.",
        category="water_accumulation_on_roads",
        address="College Street",
        status="linked",
    )
    r2 = Report(
        original_description="Gutter blocked with plastic bottles on Park Street.",
        category="suspected_drainage_blockage",
        address="Park Street",
        status="unverified",
    )
    db_session.add_all([r1, r2])
    db_session.commit()

    # Search for 'library'
    search_resp = client.get("/api/reports?search=library")
    assert search_resp.status_code == 200
    items = search_resp.json()["items"]
    assert len(items) == 1
    assert items[0]["id"] == r1.id

    # Filter by category
    cat_resp = client.get("/api/reports?category=suspected_drainage_blockage")
    assert cat_resp.status_code == 200
    cat_items = cat_resp.json()["items"]
    assert len(cat_items) == 1
    assert cat_items[0]["id"] == r2.id


def test_get_report_by_id(client, db_session):
    """GET /api/reports/{id} should return report or 404."""
    rep = Report(
        original_description="Standing water in front of residential apartments.",
        category="persistent_standing_water",
        status="unverified",
    )
    db_session.add(rep)
    db_session.commit()

    resp_found = client.get(f"/api/reports/{rep.id}")
    assert resp_found.status_code == 200
    assert resp_found.json()["id"] == rep.id

    resp_missing = client.get("/api/reports/non-existent-uuid")
    assert resp_missing.status_code == 404
    assert "was not found" in resp_missing.json()["detail"]


def test_update_report_immutability(client, db_session):
    """PATCH /api/reports/{id} should update permitted fields while preserving description."""
    original_desc = "Fixed original description that must never be altered."
    rep = Report(
        original_description=original_desc,
        category="uncertain",
        status="unverified",
    )
    db_session.add(rep)
    db_session.commit()

    patch_payload = {
        "status": "linked",
        "category": "persistent_standing_water",
        "address": "Updated Address 123",
        "original_description": "ATTEMPTED OVERWRITE OF DESCRIPTION",
    }
    resp = client.patch(f"/api/reports/{rep.id}", json=patch_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "linked"
    assert data["category"] == "persistent_standing_water"
    assert data["address"] == "Updated Address 123"
    # Verification of immutability
    assert data["original_description"] == original_desc
