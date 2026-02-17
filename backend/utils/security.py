import hashlib
import re
from typing import List

SCRIPT_PATTERN = re.compile(r"<\s*script\b", re.IGNORECASE)
ON_EVENT_PATTERN = re.compile(r"on\w+\s*=", re.IGNORECASE)
SQL_PATTERN = re.compile(
    r"(--|\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)",
    re.IGNORECASE,
)


def contains_script_injection(text: str) -> bool:
    return bool(SCRIPT_PATTERN.search(text) or ON_EVENT_PATTERN.search(text))


def contains_sql_injection_pattern(text: str) -> bool:
    return bool(SQL_PATTERN.search(text))


def is_emoji_only(text: str) -> bool:
    # Consider content invalid if it has no alphanumeric characters at all
    return not re.search(r"[A-Za-z0-9]", text)


def validate_content_safety(*fields: str) -> List[str]:
    """Return list of validation error messages."""
    errors: List[str] = []
    combined = " ".join(fields)
    if contains_script_injection(combined):
        errors.append("Potential script injection detected.")
    if contains_sql_injection_pattern(combined):
        errors.append("Potential SQL injection pattern detected.")
    if all(is_emoji_only(f) for f in fields if f.strip()):
        errors.append("Emoji-only content is not allowed.")
    return errors


def hash_message(message: str) -> str:
    normalized = message.strip().lower()
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()

