"""
SENTINEL — Rule-Based Entity Extractor
Pulls structured facts out of raw free-text report descriptions using regular
expressions. No external models or downloads required.

Extracts:
  - Location hints  (street names, landmarks, ward/area mentions)
  - Water depth     (numeric measurements OR descriptive phrases)
  - Time hints      (when the waterlogging was observed / started)
"""

from __future__ import annotations

import re
from typing import Optional

# ── Location patterns ─────────────────────────────────────────────────────────
# Matches "near X", "at X", "on X Road/Street", or explicit road/landmark names.
_LOCATION_PATTERNS: list[re.Pattern] = [
    # "near Fire Station", "near Howrah Bridge"
    re.compile(r"\bnear\s+([A-Z][a-zA-Z0-9]*(?:\s+[A-Z][a-zA-Z0-9]*){0,3})\b"),
    # "at Gariahat crossing", "at Dalhousie Square"
    re.compile(r"\bat\s+([A-Z][a-zA-Z0-9]*(?:\s+[A-Z][a-zA-Z0-9]*){0,3})\b"),
    # "on Park Street", "on AJC Bose Road", "on EM Bypass"
    re.compile(
        r"\bon\s+([A-Z][a-zA-Z0-9]*(?:\s+[A-Z][a-zA-Z0-9]*){0,3}\s+(?:Road|Street|Lane|Avenue|Marg|Bypass|Bridge|Flyover|Highway|NH|SH))\b"
    ),
    # Explicit road/area suffix mentions even without a preposition
    re.compile(
        r"\b([A-Z][a-zA-Z0-9]*(?:\s+[A-Z][a-zA-Z0-9]*){0,3}\s+(?:Road|Street|Lane|Avenue|Marg|Bypass|Bridge|Flyover|Highway|NH|SH|Junction|Crossing|Underpass|Park|Colony|Nagar|Bagh|Ghat|Bazaar|Market|Station|Hospital|School|College|University|Complex|Square))\b"
    ),
    # "Sector V", "Sector 3" etc.
    re.compile(r"\b(Sector\s+[IVX\d]+)\b", re.IGNORECASE),
    # Ward / Zone mentions
    re.compile(r"\b(Ward\s+No\.?\s*\d+|Zone\s+[A-Z]?\d*)\b", re.IGNORECASE),
]

# ── Depth patterns ─────────────────────────────────────────────────────────────
# Match numeric depths (cm, ft, feet, inches, metres) or descriptive phrases.
_DEPTH_NUMERIC = re.compile(
    r"(\d+(?:\.\d+)?\s*(?:to\s*\d+(?:\.\d+)?)?\s*(?:cm|centimetre[s]?|centimeter[s]?|ft|feet|foot|inch(?:es)?|metre[s]?|meter[s]?))",
    re.IGNORECASE,
)
_DEPTH_DESCRIPTIVE = re.compile(
    r"\b(ankle[\s-]?deep|knee[\s-]?deep|waist[\s-]?deep|chest[\s-]?deep|neck[\s-]?deep|submerged|flooded|overflowing)\b",
    re.IGNORECASE,
)

# ── Time patterns ─────────────────────────────────────────────────────────────
_TIME_PATTERNS: list[re.Pattern] = [
    # "since morning", "since last night", "since yesterday evening"
    re.compile(r"\bsince\s+(?:last\s+)?([a-z ]{2,25}?)(?=[,.\n]|$)", re.IGNORECASE),
    # "last night", "last hour", "last 2 hours"
    re.compile(r"\blast\s+(\d*\s*(?:hour[s]?|minute[s]?|night|morning|evening|afternoon|week|day[s]?))\b", re.IGNORECASE),
    # "this morning", "this evening", "this afternoon"
    re.compile(r"\bthis\s+(morning|evening|afternoon|night|week)\b", re.IGNORECASE),
    # "yesterday morning/evening/night"
    re.compile(r"\byesterday\s*(morning|evening|afternoon|night)?\b", re.IGNORECASE),
    # Specific clock times: "since 3 PM", "since 14:00"
    re.compile(r"\bsince\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\b", re.IGNORECASE),
    # "ongoing for 3 hours", "ongoing since 2 hours"
    re.compile(r"\bfor\s+(\d+\s*(?:hour[s]?|minute[s]?|day[s]?))\b", re.IGNORECASE),
]


def extract_location_hints(text: str) -> list[str]:
    """
    Extracts location references from report text.

    Args:
        text: Raw report description string.

    Returns:
        Deduplicated list of extracted location strings, longest-first.
        Empty list if nothing found.
    """
    if not text:
        return []

    found: set[str] = set()
    for pattern in _LOCATION_PATTERNS:
        for match in pattern.finditer(text):
            # Group 1 is always the captured location
            hit = match.group(1).strip().rstrip(".,;")
            # Reject very short or generic-only captures
            if len(hit) >= 4:
                found.add(hit)

    # Sort by length descending so the most specific hint appears first
    return sorted(found, key=len, reverse=True)[:8]   # cap at 8 to avoid noise


def extract_water_depth(text: str) -> Optional[str]:
    """
    Extracts the most relevant water depth mention from report text.
    Prefers numeric measurements over descriptive phrases.

    Args:
        text: Raw report description string.

    Returns:
        A short string like "knee-deep", "30 cm", "2 feet", or None.
    """
    if not text:
        return None

    # Prefer numeric depth (more precise)
    numeric_match = _DEPTH_NUMERIC.search(text)
    if numeric_match:
        return numeric_match.group(1).strip()

    # Fall back to descriptive phrase
    descriptive_match = _DEPTH_DESCRIPTIVE.search(text)
    if descriptive_match:
        return descriptive_match.group(1).strip().lower().replace(" ", "-")

    return None


def extract_time_hints(text: str) -> list[str]:
    """
    Extracts time-related hints from report text (when waterlogging started/observed).

    Args:
        text: Raw report description string.

    Returns:
        Deduplicated list of extracted time-hint strings. Empty list if none found.
    """
    if not text:
        return []

    found: set[str] = set()
    for pattern in _TIME_PATTERNS:
        for match in pattern.finditer(text):
            # Reconstruct a readable phrase from the full match (not just group 1)
            hit = match.group(0).strip().rstrip(".,;")
            if hit and len(hit) >= 4:
                found.add(hit)

    return sorted(found)[:5]   # cap at 5


def extract_all(text: str) -> dict:
    """
    Runs all extractors on the given text and returns a combined dict.

    Args:
        text: Raw report description string.

    Returns:
        {
          "location_hints": ["Park Street", "Fire Station"],
          "water_depth":    "knee-deep",        # or None
          "time_hints":     ["since morning"],
        }
    """
    return {
        "location_hints": extract_location_hints(text),
        "water_depth":    extract_water_depth(text),
        "time_hints":     extract_time_hints(text),
    }
