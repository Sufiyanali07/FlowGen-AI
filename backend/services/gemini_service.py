import asyncio
import json
import logging
from typing import Optional, Tuple

import google.generativeai as genai

from backend.config import get_settings
from backend.models.schemas import GeminiResult, TicketCreate


logger = logging.getLogger(__name__)
settings = get_settings()

genai.configure(api_key=settings.gemini_api_key)

_model = genai.GenerativeModel(settings.gemini_model)


SYSTEM_PROMPT = """
You are an AI assistant helping a customer support workflow automation system.
You MUST respond ONLY with a single JSON object and NOTHING else.
Do not include markdown, code fences, commentary, or explanations.

The expected JSON schema is:
{
  "category": "billing | technical | account | general",
  "urgency": "low | medium | high",
  "priority_score": number between 1 and 100,
  "confidence_score": number between 0 and 1,
  "draft_reply": "string",
  "reasoning_summary": "string"
}

Rules:
- Always choose one of the allowed enum values for category and urgency.
- priority_score: higher means more urgent/important.
- confidence_score: 0 to 1 indicating how confident you are.
- draft_reply: a polite, helpful response that a human agent could send with minimal edits.
- reasoning_summary: short explanation of why you chose the category, urgency, and priority.

Draft reply style rules:
- If a customer name is provided, you may greet them using their name.
- Always sign off as "Sufiyan Ali" in the closing of the draft reply.
"""


def _build_ticket_prompt(ticket: TicketCreate) -> str:
    return (
        f"{SYSTEM_PROMPT.strip()}\n\n"
        "Now analyze the following support ticket:\n"
        f"Name: {ticket.name}\n"
        f"Email: {ticket.email}\n"
        f"Subject: {ticket.subject}\n"
        f"Message: {ticket.message}\n"
    )


def _call_gemini_sync(prompt: str) -> str:
    response = _model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.3,
            "response_mime_type": "application/json",
        },
    )
    # google-generativeai returns a `GenerativeModel.Response` with `.text`
    return response.text


async def call_gemini(ticket: TicketCreate) -> Tuple[GeminiResult, Optional[str], Optional[str]]:
    """
    Call Gemini and return (GeminiResult, raw_json, error_message).
    If an error occurs or JSON is invalid twice, returns a fallback GeminiResult and error_message.
    """
    prompt = _build_ticket_prompt(ticket)

    async def _attempt() -> str:
        return await asyncio.to_thread(_call_gemini_sync, prompt)

    last_error: Optional[str] = None
    raw_json: Optional[str] = None

    for attempt in range(2):
        try:
            raw_json = await asyncio.wait_for(_attempt(), timeout=20.0)
            data = json.loads(raw_json)

            result = GeminiResult(
                category=data.get("category"),
                urgency=data.get("urgency"),
                priority_score=data.get("priority_score"),
                confidence_score=data.get("confidence_score"),
                draft_reply=data.get("draft_reply"),
                reasoning_summary=data.get("reasoning_summary"),
            )
            return result, raw_json, None
        except asyncio.TimeoutError:
            last_error = "Gemini timeout"
            logger.exception("Gemini timeout on attempt %s", attempt + 1)
        except json.JSONDecodeError:
            last_error = "Invalid JSON from Gemini"
            logger.exception("Invalid JSON from Gemini on attempt %s", attempt + 1)
        except Exception as exc:  # noqa: BLE001
            msg = str(exc).lower()
            if "429" in msg or "quota" in msg or "rate" in msg:
                last_error = "Gemini quota or rate limit error"
            else:
                last_error = "Gemini API error"
            logger.exception("Gemini error on attempt %s: %s", attempt + 1, exc)
            break

    # Fallback
    fallback_reply = (
        "We are unable to auto-process this ticket at the moment. "
        "It has been forwarded to human support."
    )
    fallback = GeminiResult(
        category=None,
        urgency=None,
        priority_score=None,
        confidence_score=None,
        draft_reply=fallback_reply,
        reasoning_summary="Fallback response due to Gemini error or invalid output.",
    )
    return fallback, raw_json, last_error

