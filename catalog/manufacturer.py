"""Canonical manufacturer name normalization."""

# Case-insensitive aliases → preferred display spelling.
_CANONICAL = {
    "wago": "Wago",
}


def normalize_manufacturer(value: str | None) -> str:
    if not value:
        return ""
    trimmed = value.strip()
    if not trimmed:
        return ""
    return _CANONICAL.get(trimmed.casefold(), trimmed)
