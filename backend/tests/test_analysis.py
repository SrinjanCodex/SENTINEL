"""
SENTINEL — Report Analysis Unit & Integration Tests (Milestone 3)
Verifies:
  - Entity extractor (locations, water depth, time hints)
  - Severity classifier (predictions, probabilities, class scores)
  - Semantic duplicate detector (cosine similarity thresholding)
  - Composite confidence score calculation
  - API endpoints: POST /api/reports/{id}/analyze and GET /api/reports/{id}/analysis
  - Auto-analysis on report creation
"""
import pytest
from app.analysis.extractor import (
    extract_location_hints,
    extract_water_depth,
    extract_time_hints,
    extract_all,
)
from app.analysis.classifier import classify
from app.analysis.duplicates import find_duplicates
from app.analysis.confidence import compute_confidence
from app.analysis.embeddings import get_embedding, get_provider_name


def test_extractor_locations():
    """Extracts road names, landmarks, and prepositions correctly."""
    text = "Severe flooding on Park Street near Fire Station. Water is rising fast."
    locations = extract_location_hints(text)
    assert any("Park Street" in loc for loc in locations)
    assert any("Fire Station" in loc for loc in locations)


def test_extractor_depth_numeric_and_descriptive():
    """Extracts numeric water depth measurements and descriptive phrases."""
    text1 = "Water depth is roughly 45 cm on the main carriageway."
    assert extract_water_depth(text1) == "45 cm"

    text2 = "Vehicles cannot pass because water is knee-deep."
    assert "knee-deep" in (extract_water_depth(text2) or "")

    text3 = "No water depth mentioned here, only heavy rain."
    assert extract_water_depth(text3) is None


def test_extractor_time_hints():
    """Extracts temporal mentions like 'since morning' or 'last night'."""
    text = "Water has been accumulating since morning, worsening since last night."
    hints = extract_time_hints(text)
    assert any("since morning" in h.lower() for h in hints)


def test_extractor_all_combined():
    """extract_all combines location, depth, and time extractions."""
    text = "Flooding at Gariahat crossing. Water is 30 cm deep since last night."
    data = extract_all(text)
    assert "location_hints" in data
    assert "water_depth" in data
    assert "time_hints" in data
    assert data["water_depth"] == "30 cm"


def test_classifier_predict_shape_and_classes():
    """Verifies that the classifier returns valid severity labels and probabilities."""
    text = "Emergency: 4 feet of water inside ground floor apartments, life-threatening situation."
    result = classify(text)
    assert "label" in result
    assert result["label"] in ["low", "moderate", "high", "critical", "uncertain"]
    assert "probability" in result
    assert 0.0 <= result["probability"] <= 1.0
    assert "all_scores" in result
    assert isinstance(result["all_scores"], dict)


def test_classifier_empty_input():
    """Empty or whitespace text returns uncertain label safely."""
    result = classify("")
    assert result["label"] == "uncertain"
    assert result["probability"] == 0.0


def test_duplicate_detection_similar_and_dissimilar():
    """Detects semantically similar reports and filters out unrelated ones."""
    existing = [
        {"id": "rep-1", "text": "Waterlogging on Park Street with knee-deep water and stalled cars."},
        {"id": "rep-2", "text": "A fallen tree branch on Lake Road footpath, no water accumulation."},
    ]
    query = "Knee-deep water on Park Street, multiple vehicles stuck."
    # High similarity with rep-1, low with rep-2
    duplicates = find_duplicates(query, existing, threshold=0.40)
    assert len(duplicates) >= 1
    assert duplicates[0]["id"] == "rep-1"
    assert duplicates[0]["similarity"] > 0.40


def test_duplicate_detection_empty():
    """Empty inputs return empty list without crashing."""
    assert find_duplicates("", [{"id": "1", "text": "hello"}]) == []
    assert find_duplicates("some text", []) == []


def test_confidence_score_range_and_reason():
    """Confidence score is bounded in [0.0, 1.0] and includes human-readable reason."""
    conf = compute_confidence(
        classifier_prob=0.85,
        text="Sample text",
        location_hints=["Park Street"],
        water_depth="30 cm",
        time_hints=["since morning"],
        duplicates=[{"id": "rep-1", "similarity": 0.88}],
    )
    assert 0.0 <= conf["score"] <= 1.0
    assert isinstance(conf["reason"], str)
    assert "Classifier" in conf["reason"]


def test_embedding_generation_and_caching():
    """Embedding function returns 1-D vector and active provider name."""
    provider = get_provider_name()
    assert provider in ["sentence-transformers", "tfidf"]

    vec1 = get_embedding("Waterlogging on Park Street")
    vec2 = get_embedding("Waterlogging on Park Street")
    # Cached reference or identical values
    assert vec1.shape == vec2.shape
    assert len(vec1.shape) == 1


def test_api_analyze_and_get_analysis_endpoints(client):
    """End-to-end test of POST /api/reports/{id}/analyze and GET /api/reports/{id}/analysis."""
    # 1. Create a report
    payload = {
        "original_description": "Severe waterlogging on Central Avenue near Shyambazar. Water is 50 cm deep since morning.",
        "address": "Central Avenue",
        "reported_severity": 4,
    }
    create_res = client.post("/api/reports", json=payload)
    assert create_res.status_code == 201
    report_id = create_res.json()["id"]

    # 2. Check that auto-analysis was created
    get_res = client.get(f"/api/reports/{report_id}/analysis")
    assert get_res.status_code == 200
    analysis = get_res.json()
    assert analysis["report_id"] == report_id
    assert analysis["severity"] in ["low", "moderate", "high", "critical", "uncertain"]
    assert 0.0 <= analysis["confidence_score"] <= 1.0
    assert isinstance(analysis["extracted_locations"], list)
    assert analysis["extracted_depth"] is not None

    # 3. Explicitly re-trigger POST analyze
    re_analyze_res = client.post(f"/api/reports/{report_id}/analyze")
    assert re_analyze_res.status_code == 200
    re_analysis = re_analyze_res.json()
    assert re_analysis["report_id"] == report_id


def test_api_analysis_404_not_found(client):
    """Returns 404 for non-existent report ID."""
    res_get = client.get("/api/reports/non-existent-uuid/analysis")
    assert res_get.status_code == 404

    res_post = client.post("/api/reports/non-existent-uuid/analyze")
    assert res_post.status_code == 404
