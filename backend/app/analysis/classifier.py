"""
SENTINEL — Severity Classifier
Classifies report text into low | moderate | high | critical.
Trained from seed data, persisted via joblib, loaded lazily.
"""
from __future__ import annotations
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger("sentinel.analysis.classifier")

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_MODEL_PATH = _BACKEND_DIR / "data" / "severity_model.joblib"
_CSV_PATH = _BACKEND_DIR / "data" / "seed_reports.csv"
_pipeline = None


def _load_pipeline():
    """Loads the trained severity pipeline from disk (once, then cached)."""
    global _pipeline
    if _pipeline is not None:
        return _pipeline
    if not _MODEL_PATH.exists():
        logger.warning("Severity model not found at %s. Run train_classifier.py", _MODEL_PATH)
        return None
    try:
        import joblib
        _pipeline = joblib.load(str(_MODEL_PATH))
        logger.info("Severity classifier loaded from %s", _MODEL_PATH)
    except Exception as exc:
        logger.warning("Could not load severity model: %s", exc)
        _pipeline = None
    return _pipeline

    if _pipeline is not None:
        return _pipeline

    if not _MODEL_PATH.exists():
        logger.warning(
            "Severity model not found at %s. "
            "Run: python scripts/train_classifier.py",
            _MODEL_PATH,
        )
        return None

    try:
        import joblib  # type: ignore
        _pipeline = joblib.load(str(_MODEL_PATH))
        logger.info("Severity classifier loaded from %s", _MODEL_PATH)
    except Exception as exc:
        logger.warning("Could not load severity model: %s", exc)
        _pipeline = None

    return _pipeline


def classify(text: str) -> dict:
    """
    Classifies the report text and returns a dict with the predicted label
    and the classifier's confidence (probability) for that label.

    Returns:
        {
          "label": "moderate",        # one of low / moderate / high / critical / uncertain
          "probability": 0.84,        # 0.0–1.0; 0.0 when model unavailable
          "all_scores": {             # probabilities for every class
              "low": 0.04,
              "moderate": 0.84,
              "high": 0.08,
              "critical": 0.04
          }
        }
    """
    if not text or not text.strip():
        return _uncertain()

    pipeline = _load_pipeline()
    if pipeline is None:
        return _uncertain()

    try:
        # predict_proba returns shape (1, n_classes)
        import numpy as np  # type: ignore
        probs = pipeline.predict_proba([text.strip()])[0]
        classes = list(pipeline.classes_)

        best_idx = int(np.argmax(probs))
        label = str(classes[best_idx])
        probability = float(probs[best_idx])
        all_scores = {str(cls): float(p) for cls, p in zip(classes, probs)}

        return {
            "label": label,
            "probability": probability,
            "all_scores": all_scores,
        }
    except Exception as exc:
        logger.warning("Classifier inference failed: %s", exc)
        return _uncertain()


def _uncertain() -> dict:
    """Returns safe default when classification is unavailable."""
    return {
        "label": "uncertain",
        "probability": 0.0,
        "all_scores": {"low": 0.0, "moderate": 0.0, "high": 0.0, "critical": 0.0},
    }


def train_and_save(csv_path: Optional[str] = None, model_path: Optional[str] = None) -> None:
    """
    Trains the severity classifier from the seed CSV and saves it with joblib.
    Can be called from the CLI train script or imported in tests.

    Args:
        csv_path:  Path to the labelled CSV (defaults to data/seed_reports.csv).
        model_path: Where to save the model (defaults to data/severity_model.joblib).
    """
    import csv
    import joblib  # type: ignore
    from sklearn.pipeline import Pipeline  # type: ignore
    from sklearn.feature_extraction.text import TfidfVectorizer  # type: ignore
    from sklearn.linear_model import LogisticRegression  # type: ignore
    from sklearn.model_selection import cross_val_score  # type: ignore

    csv_file  = Path(csv_path)  if csv_path  else _CSV_PATH
    out_file  = Path(model_path) if model_path else _MODEL_PATH

    if not csv_file.exists():
        raise FileNotFoundError(f"Seed CSV not found: {csv_file}")

    texts, labels = [], []
    with open(csv_file, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            text = row.get("text", "").strip().strip('"')
            label = row.get("severity", "").strip()
            if text and label:
                texts.append(text)
                labels.append(label)

    if len(texts) < 4:
        raise ValueError(f"Need at least 4 labelled examples; found {len(texts)}.")

    logger.info("Training on %d examples …", len(texts))

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=2000,
            sublinear_tf=True,
            strip_accents="unicode",
        )),
        ("clf", LogisticRegression(
            C=1.0,
            max_iter=1000,
            class_weight="balanced",   # handles imbalanced seed data gracefully
            random_state=42,
        )),
    ])

    # Quick cross-validation score for transparency
    try:
        scores = cross_val_score(pipeline, texts, labels, cv=min(5, len(texts) // 2), scoring="accuracy")
        logger.info("CV accuracy: %.2f ± %.2f", scores.mean(), scores.std())
    except Exception:
        pass   # CV may fail on very small datasets; training still proceeds

    pipeline.fit(texts, labels)

    out_file.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, str(out_file))
    logger.info("Model saved to %s", out_file)

    # Reset cached pipeline so the new model is loaded next call
    global _pipeline
    _pipeline = None
