"""Parse Width / Height / Depth from component names."""

from __future__ import annotations

import re
from decimal import Decimal, InvalidOperation

# e.g. "WHD: 380x600x210 mm" or "WHD:800x1000x300 mm GRP"
WHD_IN_NAME_RE = re.compile(
    r"WHD\s*:\s*"
    r"(\d+(?:\.\d+)?)\s*[xX×]\s*"
    r"(\d+(?:\.\d+)?)\s*[xX×]\s*"
    r"(\d+(?:\.\d+)?)"
    r"(?:\s*mm)?",
    re.IGNORECASE,
)


def _to_mm(raw: str) -> Decimal | None:
    try:
        return Decimal(raw).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        return None


def parse_whd_from_name(name: str) -> tuple[Decimal | None, Decimal | None, Decimal | None]:
    """Return (width_mm, height_mm, depth_mm) when name contains WHD: WxHxD."""
    if not name:
        return None, None, None
    match = WHD_IN_NAME_RE.search(name)
    if not match:
        return None, None, None
    return _to_mm(match.group(1)), _to_mm(match.group(2)), _to_mm(match.group(3))
