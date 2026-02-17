from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class TicketCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    subject: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=10, max_length=5000)

    @field_validator("name", "subject", "message")
    @classmethod
    def no_whitespace_only(cls, v: str) -> str:
        if not v or v.strip() == "":
            raise ValueError("Field cannot be empty or whitespace-only.")
        return v


class GeminiResult(BaseModel):
    category: Optional[str] = None
    urgency: Optional[str] = None
    priority_score: Optional[int] = None
    confidence_score: Optional[float] = None
    draft_reply: Optional[str] = None
    reasoning_summary: Optional[str] = None


class GuardrailResult(BaseModel):
    flags: List[str] = []
    status: str
    needs_human_review: bool


class TicketResponse(BaseModel):
    id: int
    name: str
    email: str
    subject: str
    message: str

    category: Optional[str]
    urgency: Optional[str]
    priority_score: Optional[int]
    confidence_score: Optional[float]

    draft_reply: Optional[str]
    reasoning_summary: Optional[str]

    status: str
    guardrail_flags: List[str] = []
    routing_decision: Optional[str]
    is_duplicate: bool
    original_ticket_id: Optional[int]

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TicketListItem(BaseModel):
    id: int
    name: str
    email: str
    subject: str
    category: Optional[str]
    urgency: Optional[str]
    priority_score: Optional[int]
    confidence_score: Optional[float]
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TicketLogEntry(BaseModel):
    id: int
    timestamp: datetime
    raw_input: str
    ai_output: Optional[str]
    guardrail_flags: Optional[str]
    routing_decision: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class TicketListResponse(BaseModel):
    items: List[TicketListItem]


class ErrorResponse(BaseModel):
    code: str
    message: str
    details: Optional[dict] = None

