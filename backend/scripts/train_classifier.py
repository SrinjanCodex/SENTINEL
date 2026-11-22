"""
SENTINEL — Severity Classifier Training Script
Run this once (or whenever seed_reports.csv changes) to train the model:

    cd backend
    .venv\\Scripts\\python scripts\\train_classifier.py

The trained model is saved to data/severity_model.joblib.
"""

import sys
import logging
from pathlib import Path

# Allow importing from the backend app package
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("sentinel.train")

from app.analysis.classifier import train_and_save, _CSV_PATH, _MODEL_PATH


def main() -> None:
    logger.info("=" * 60)
    logger.info("SENTINEL Severity Classifier Training")
    logger.info("=" * 60)
    logger.info("Seed data : %s", _CSV_PATH)
    logger.info("Output    : %s", _MODEL_PATH)

    if not _CSV_PATH.exists():
        logger.error("Seed CSV not found: %s", _CSV_PATH)
        logger.error("Make sure you are running from the backend/ directory.")
        sys.exit(1)

    try:
        train_and_save()
        logger.info("✅ Training complete. Model saved to %s", _MODEL_PATH)
        logger.info("Restart the backend server to load the new model.")
    except Exception as exc:
        logger.error("Training failed: %s", exc, exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
