"""
SENTINEL — Database Seeder
Populates the SQLite database with clearly labelled synthetic demonstration data (is_synthetic=True).
Can be run standalone: python -m app.seed
"""
from datetime import datetime, timezone
from app.database import SessionLocal, init_db
from app.models import Report, Incident, IncidentReport

DEMO_CITY_LAT = 22.5726
DEMO_CITY_LNG = 88.3639

DEMO_REPORTS = [
    {
        "id": "demo-001",
        "original_description": "Large puddle of standing water has formed outside the main school gate on Park Street. Water is about ankle-deep and blocking the footpath. It has not moved since morning.",
        "category": "persistent_standing_water",
        "category_confidence": 0.87,
        "category_uncertain": False,
        "reported_severity": 3,
        "address": "Park Street, near St. Xavier's School",
        "latitude": DEMO_CITY_LAT + 0.002,
        "longitude": DEMO_CITY_LNG - 0.001,
        "observed_at": datetime.fromisoformat("2026-10-20T08:30:00+05:30"),
        "submitted_at": datetime.fromisoformat("2026-10-20T08:45:00+05:30"),
        "status": "linked",
        "photo_reference": None,
        "reporter_token": "tok-anon-a1b2",
        "is_synthetic": True,
    },
    {
        "id": "demo-002",
        "original_description": "The road near the school entrance is flooded. Cars are splashing through it and wetting pedestrians. Seems to come from a blocked drain.",
        "category": "suspected_drainage_blockage",
        "category_confidence": 0.79,
        "category_uncertain": False,
        "reported_severity": 4,
        "address": "School entrance road, Park Street",
        "latitude": DEMO_CITY_LAT + 0.0022,
        "longitude": DEMO_CITY_LNG - 0.0009,
        "observed_at": datetime.fromisoformat("2026-10-20T09:15:00+05:30"),
        "submitted_at": datetime.fromisoformat("2026-10-20T09:22:00+05:30"),
        "status": "linked",
        "photo_reference": None,
        "reporter_token": "tok-anon-c3d4",
        "is_synthetic": True,
    },
    {
        "id": "demo-003",
        "original_description": "Standing water remains near the school after rainfall last night. The drain grate looks clogged with leaves.",
        "category": "suspected_drainage_blockage",
        "category_confidence": 0.82,
        "category_uncertain": False,
        "reported_severity": 3,
        "address": "Near Park Street School gate",
        "latitude": DEMO_CITY_LAT + 0.0018,
        "longitude": DEMO_CITY_LNG - 0.0012,
        "observed_at": datetime.fromisoformat("2026-10-20T10:00:00+05:30"),
        "submitted_at": datetime.fromisoformat("2026-10-20T10:05:00+05:30"),
        "status": "linked",
        "photo_reference": None,
        "reporter_token": "tok-anon-e5f6",
        "is_synthetic": True,
    },
    {
        "id": "demo-004",
        "original_description": "Water is entering the ground floor of our building on Central Avenue. The entrance step is submerged. We moved items off the floor but the water level is rising slowly.",
        "category": "water_entering_building",
        "category_confidence": 0.94,
        "category_uncertain": False,
        "reported_severity": 5,
        "address": "14 Central Avenue, BBD Bagh",
        "latitude": DEMO_CITY_LAT - 0.015,
        "longitude": DEMO_CITY_LNG + 0.022,
        "observed_at": datetime.fromisoformat("2026-10-20T07:45:00+05:30"),
        "submitted_at": datetime.fromisoformat("2026-10-20T07:52:00+05:30"),
        "status": "unverified",
        "photo_reference": None,
        "reporter_token": "tok-anon-g7h8",
        "is_synthetic": True,
    },
    {
        "id": "demo-005",
        "original_description": "Vehicles are stuck in deep water at the College Street underpass. Situation is dangerous. Water level looks like 2 feet.",
        "category": "water_accumulation_on_roads",
        "category_confidence": 0.91,
        "category_uncertain": False,
        "reported_severity": 5,
        "address": "College Street underpass",
        "latitude": DEMO_CITY_LAT + 0.008,
        "longitude": DEMO_CITY_LNG + 0.003,
        "observed_at": datetime.fromisoformat("2026-10-20T06:30:00+05:30"),
        "submitted_at": datetime.fromisoformat("2026-10-20T06:35:00+05:30"),
        "status": "linked",
        "photo_reference": None,
        "reporter_token": "tok-anon-i9j0",
        "is_synthetic": True,
    },
    {
        "id": "demo-006",
        "original_description": "Mild dampness on the footpath near the park. Not sure if it is a drainage issue or sprinkler overspray. Not causing any problems right now.",
        "category": "uncertain",
        "category_confidence": 0.38,
        "category_uncertain": True,
        "reported_severity": 1,
        "address": "Maidan Park entrance",
        "latitude": DEMO_CITY_LAT + 0.005,
        "longitude": DEMO_CITY_LNG - 0.007,
        "observed_at": datetime.fromisoformat("2026-10-20T11:00:00+05:30"),
        "submitted_at": datetime.fromisoformat("2026-10-20T11:10:00+05:30"),
        "status": "unverified",
        "photo_reference": None,
        "reporter_token": "tok-anon-k1l2",
        "is_synthetic": True,
    },
    {
        "id": "demo-007",
        "original_description": "Same location as my earlier report — the water has receded a bit but the drain is still blocked.",
        "category": "suspected_drainage_blockage",
        "category_confidence": 0.75,
        "category_uncertain": False,
        "reported_severity": 2,
        "address": "Near school gate, Park Street",
        "latitude": DEMO_CITY_LAT + 0.002,
        "longitude": DEMO_CITY_LNG - 0.001,
        "observed_at": datetime.fromisoformat("2026-10-20T14:00:00+05:30"),
        "submitted_at": datetime.fromisoformat("2026-10-20T14:08:00+05:30"),
        "status": "linked",
        "photo_reference": None,
        "reporter_token": "tok-anon-a1b2",
        "is_synthetic": True,
    },
    {
        "id": "demo-008",
        "original_description": "Broken street light on Strand Road. No waterlogging here, just a safety hazard at night.",
        "category": "uncertain",
        "category_confidence": 0.12,
        "category_uncertain": True,
        "reported_severity": None,
        "address": "Strand Road near Howrah Bridge",
        "latitude": DEMO_CITY_LAT + 0.011,
        "longitude": DEMO_CITY_LNG - 0.014,
        "observed_at": None,
        "submitted_at": datetime.fromisoformat("2026-10-20T19:30:00+05:30"),
        "status": "unverified",
        "photo_reference": None,
        "reporter_token": "tok-anon-m3n4",
        "is_synthetic": True,
    },
]

DEMO_INCIDENTS = [
    {
        "id": "inc-demo-001",
        "title": "Suspected drainage blockage — Park Street School area",
        "centroid_latitude": DEMO_CITY_LAT + 0.002,
        "centroid_longitude": DEMO_CITY_LNG - 0.001,
        "first_observed_at": datetime.fromisoformat("2026-10-20T08:30:00+05:30"),
        "last_observed_at": datetime.fromisoformat("2026-10-20T14:00:00+05:30"),
        "verification_status": "suspected",
        "created_at": datetime.fromisoformat("2026-10-20T10:30:00+05:30"),
        "last_analysed_at": datetime.fromisoformat("2026-10-20T14:10:00+05:30"),
        "analysis_version": "v0.1-demo",
        "priority_score": 68.0,
        "report_ids": ["demo-001", "demo-002", "demo-003", "demo-007"],
    },
    {
        "id": "inc-demo-002",
        "title": "Water accumulation — College Street underpass",
        "centroid_latitude": DEMO_CITY_LAT + 0.008,
        "centroid_longitude": DEMO_CITY_LNG + 0.003,
        "first_observed_at": datetime.fromisoformat("2026-10-20T06:30:00+05:30"),
        "last_observed_at": datetime.fromisoformat("2026-10-20T06:30:00+05:30"),
        "verification_status": "suspected",
        "created_at": datetime.fromisoformat("2026-10-20T07:00:00+05:30"),
        "last_analysed_at": datetime.fromisoformat("2026-10-20T07:00:00+05:30"),
        "analysis_version": "v0.1-demo",
        "priority_score": 82.0,
        "report_ids": ["demo-005"],
    },
    {
        "id": "inc-demo-003",
        "title": "Water entering building — Central Avenue",
        "centroid_latitude": DEMO_CITY_LAT - 0.015,
        "centroid_longitude": DEMO_CITY_LNG + 0.022,
        "first_observed_at": datetime.fromisoformat("2026-10-20T07:45:00+05:30"),
        "last_observed_at": datetime.fromisoformat("2026-10-20T07:45:00+05:30"),
        "verification_status": "under_verification",
        "created_at": datetime.fromisoformat("2026-10-20T08:00:00+05:30"),
        "last_analysed_at": datetime.fromisoformat("2026-10-20T08:00:00+05:30"),
        "analysis_version": "v0.1-demo",
        "priority_score": 91.0,
        "report_ids": ["demo-004"],
    },
]


def seed_database(db=None) -> None:
    """Seeds synthetic demo reports and incidents if not already present."""
    close_db = False
    if db is None:
        init_db()
        db = SessionLocal()
        close_db = True

    try:
        # Check existing synthetic reports
        existing_report_ids = {r.id for r in db.query(Report.id).all()}

        for rep_data in DEMO_REPORTS:
            if rep_data["id"] not in existing_report_ids:
                rep = Report(**rep_data)
                db.add(rep)

        db.commit()

        # Check existing synthetic incidents
        existing_incident_ids = {i.id for i in db.query(Incident.id).all()}

        for inc_data in DEMO_INCIDENTS:
            rep_ids = inc_data.pop("report_ids", [])
            if inc_data["id"] not in existing_incident_ids:
                incident = Incident(**inc_data)
                db.add(incident)
                db.flush()

                for r_id in rep_ids:
                    link = IncidentReport(
                        incident_id=incident.id,
                        report_id=r_id,
                        match_score=0.85,
                        match_reasons=["geographic_proximity", "keyword_overlap"],
                        is_independent=True,
                        added_by="system",
                    )
                    db.add(link)

        db.commit()

        # Generate priority assessment breakdown and missing signals
        try:
            from app.routers.incidents import _assess_and_sync_incident
            for inc in db.query(Incident).all():
                _assess_and_sync_incident(inc, db)
        except Exception as exc:
            print(f"[SENTINEL] Note: Assessment sync during seed: {exc}")

        print(f"[SENTINEL] Seeded {len(DEMO_REPORTS)} synthetic reports and {len(DEMO_INCIDENTS)} incidents.")
    finally:
        if close_db:
            db.close()


if __name__ == "__main__":
    seed_database()
