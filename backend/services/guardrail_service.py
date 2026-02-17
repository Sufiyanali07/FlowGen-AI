import re
from typing import List

from backend.models.schemas import GeminiResult, GuardrailResult


HIGH_RISK_PHRASES = [
    "money-back guarantee",
    "full refund",
    "we guarantee a refund",
    "we will refund",
    "legal advice",
    "this is legal advice",
    "we are not liable",
    "we are not responsible",
    "compliant with all regulations",
    "fully compliant",
    "pci compliant",
    "hipaa compliant",
    "gdpr compliant",
    "policy",
    "terms and conditions",
]


def scan_draft_for_risks(draft: str) -> List[str]:
    flags: List[str] = []
    text = draft.lower()

    for phrase in HIGH_RISK_PHRASES:
        if phrase in text:
            if "refund" in phrase:
                flags.append("refund_or_financial_commitment")
            elif "legal" in phrase:
                flags.append("legal_advice_or_liability")
            elif "compliant" in phrase:
                flags.append("compliance_claim")
            elif "policy" in phrase or "terms" in phrase:
                flags.append("fabricated_or_risky_policy")

    # Simple financial commitment pattern
    if re.search(r"\b(refund|reimburse|compensate|credit)\b", text):
        if "refund_or_financial_commitment" not in flags:
            flags.append("refund_or_financial_commitment")

    return list(sorted(set(flags)))


def apply_guardrails(result: GeminiResult) -> GuardrailResult:
    flags: List[str] = []

    if result.confidence_score is not None and result.confidence_score < 0.65:
        flags.append("low_confidence")

    urgency = (result.urgency or "").lower()
    if urgency == "high":
        flags.append("high_urgency")

    if result.draft_reply:
        flags.extend(scan_draft_for_risks(result.draft_reply))

    flags = list(sorted(set(flags)))

    needs_human_review = len(flags) > 0
    status = "Needs Human Review" if needs_human_review else "Auto-Resolved"

    return GuardrailResult(flags=flags, status=status, needs_human_review=needs_human_review)

