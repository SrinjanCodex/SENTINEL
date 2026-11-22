"""
SENTINEL — Optional Advanced Features (Milestone 7) Tests
Tests GeoJSON FeatureCollection exports and CSV data download for municipal GIS systems.
"""
def test_export_reports_geojson(client):
    # Seed or post a report
    client.post("/api/reports", json={
        "original_description": "Export test street ponding",
        "latitude": 22.56,
        "longitude": 88.35,
        "address": "Park Street",
    })
    resp = client.get("/api/reports/export/geojson")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert "features" in data
    assert len(data["features"]) >= 1
    f = data["features"][0]
    assert f["type"] == "Feature"
    assert f["geometry"]["type"] == "Point"
    assert len(f["geometry"]["coordinates"]) == 2


def test_export_reports_csv(client):
    client.post("/api/reports", json={
        "original_description": "CSV export waterlogging test",
        "latitude": 22.57,
        "longitude": 88.36,
        "address": "BBD Bagh, Kolkata",
    })
    resp = client.get("/api/reports/export/csv")
    assert resp.status_code == 200
    assert "text/csv" in resp.headers.get("content-type", "")
    content = resp.text
    lines = content.strip().split("\r\n") if "\r\n" in content else content.strip().split("\n")
    assert len(lines) >= 2
    header = lines[0].split(",")
    assert "id" in header
    assert "latitude" in header
    assert "longitude" in header


def test_export_incidents_geojson(client):
    client.post("/api/reports", json={
        "original_description": "Cluster export waterlogging incident test",
        "latitude": 22.58,
        "longitude": 88.37,
        "address": "College Street, Kolkata",
    })
    client.post("/api/incidents/cluster")
    resp = client.get("/api/incidents/export/geojson")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert "features" in data
    assert len(data["features"]) >= 1
    f = data["features"][0]
    assert f["type"] == "Feature"
    assert f["geometry"]["type"] == "Point"
    assert len(f["geometry"]["coordinates"]) == 2
