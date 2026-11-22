"""
SENTINEL — Prioritisation & Missing-Signal Subsystem Tests
Tests multi-factor scoring formula, deterministic missing signal rules,
and the human verification workflow API.
"""
from datetime import datetime, timezone
from app.prioritisation.scoring import calculate_priority_score
from app.prioritisation.missing_signals import detect_missing_signals


def test_priority_scoring_calculation():
    class MockLink:
        def __init__(self, report, is_independent=True):
            self.report = report
            self.is_independent = is_independent

    class MockReport:
        def __init__(self, sev, cat, address, photo=None):
            self.reported_severity = sev
            self.category = cat
            self.address = address
            self.original_description = address
            self.photo_reference = photo
            self.analysis = None

    class MockIncident:
        def __init__(self, links):
            self.report_links = links
            self.created_at = datetime.now(timezone.utc)
            self.last_observed_at = datetime.now(timezone.utc)
            self.centroid_latitude = 22.55
            self.centroid_longitude = 88.35
            self.verification_status = "suspected"
            self.evidence_items = []

    r1 = MockReport(5, "water_entering_building", "Park Street", photo="photo.jpg")
    r2 = MockReport(4, "roadway_flooding", "Park Street bookstore")
    inc_high = MockIncident([MockLink(r1), MockLink(r2)])

    score, factors = calculate_priority_score(inc_high)
    assert 0.0 <= score <= 100.0
    assert len(factors) == 6
    total_weights = sum(f["weight"] for f in factors)
    assert abs(total_weights - 1.0) < 0.001
    assert abs(sum(f["contribution"] for f in factors) - score) < 0.2

    # Lower severity incident
    r_low = MockReport(1, "other_waterlogging", "Peripheral Road")
    inc_low = MockIncident([MockLink(r_low)])
    score_low, _ = calculate_priority_score(inc_low)
    assert score > score_low


def test_missing_signal_rules():
    class MockIncident:
        def __init__(self):
            self.centroid_latitude = None
            self.centroid_longitude = None
            self.verification_status = "suspected"
            self.report_links = []
            self.evidence_items = []

    inc = MockIncident()
    flags = detect_missing_signals(inc)
    rule_ids = {f["rule_id"] for f in flags}
    assert "MS-LOC" in rule_ids
    assert "MS-VERIFY" in rule_ids
    assert "MS-INDEP" in rule_ids
    assert "MS-PHOTO" in rule_ids


def test_verification_workflow_and_api(client):
    # 1. Create a report and cluster it into an incident
    rep_data = {
        "original_description": "Water backing up from street drain",
        "latitude": 22.57,
        "longitude": 88.36,
        "address": "BBD Bagh, Kolkata",
        "reported_severity": 4,
    }
    client.post("/api/reports", json=rep_data)
    client.post("/api/incidents/cluster")

    inc_list = client.get("/api/incidents").json()
    assert inc_list["total"] >= 1
    inc_id = inc_list["items"][0]["id"]

    # 2. Get priority score breakdown
    p_resp = client.get(f"/api/incidents/{inc_id}/priority")
    assert p_resp.status_code == 200
    p_data = p_resp.json()
    assert "factors" in p_data
    assert len(p_data["factors"]) == 6

    # 3. Get missing signals
    ms_resp = client.get(f"/api/incidents/{inc_id}/missing-signals")
    assert ms_resp.status_code == 200
    ms_data = ms_resp.json()
    assert isinstance(ms_data, list)
    rule_ids = [m["rule_id"] for m in ms_data]
    assert "MS-VERIFY" in rule_ids

    # 4. Record human verification
    verif_payload = {
        "new_status": "verified",
        "changed_by": "Inspector Das (Ward 45)",
        "note": "On-site inspection confirmed 35cm roadway waterlogging. Sump pumps deployed.",
    }
    v_resp = client.patch(f"/api/incidents/{inc_id}/verification", json=verif_payload)
    assert v_resp.status_code == 200
    v_data = v_resp.json()
    assert v_data["verification_status"] == "verified"
    assert len(v_data["verification_records"]) >= 1
    latest_rec = v_data["verification_records"][-1]
    assert latest_rec["new_status"] == "verified"
    assert latest_rec["changed_by"] == "Inspector Das (Ward 45)"

    # 5. Invalid status is rejected
    bad_resp = client.patch(f"/api/incidents/{inc_id}/verification", json={"new_status": "bogus", "note": "test"})
    assert bad_resp.status_code == 400
