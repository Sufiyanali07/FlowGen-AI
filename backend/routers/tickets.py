from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from backend.database import crud, models as db_models
from backend.database.session import get_db
from backend.models.schemas import (
    ErrorResponse,
    TicketCreate,
    TicketListItem,
    TicketListResponse,
    TicketLogEntry,
    TicketResponse,
)
from backend.services.gemini_service import call_gemini
from backend.services.guardrail_service import apply_guardrails
from backend.utils.rate_limiter import rate_limiter
from backend.utils.security import hash_message, validate_content_safety


router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.post(
    "",
    response_model=TicketResponse,
    responses={400: {"model": ErrorResponse}, 429: {"model": ErrorResponse}},
)
async def create_ticket(
    ticket_in: TicketCreate,
    request: Request,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limiter),
):
    # Additional security validation
    security_errors = validate_content_safety(
        ticket_in.name, ticket_in.subject, ticket_in.message
    )
    if security_errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "validation_error",
                "message": "Input failed security validation.",
                "details": {"issues": security_errors},
            },
        )

    message_hash = hash_message(ticket_in.message)
    existing = crud.get_ticket_by_hash(db, message_hash)

    is_duplicate = existing is not None
    original_ticket_id = existing.id if existing else None

    # Call Gemini
    gemini_result, raw_json, gemini_error = await call_gemini(ticket_in)
    guardrail = apply_guardrails(gemini_result)

    if guardrail.needs_human_review:
        routing_decision = "Human Review"
    else:
        routing_decision = "Auto-Resolve"

    # Persist ticket
    ticket = db_models.Ticket(
        name=ticket_in.name,
        email=ticket_in.email,
        subject=ticket_in.subject,
        message=ticket_in.message,
        message_hash=message_hash,
        is_duplicate=is_duplicate,
        original_ticket_id=original_ticket_id,
        category=(gemini_result.category or None),
        urgency=(gemini_result.urgency or None),
        priority_score=gemini_result.priority_score,
        confidence_score=gemini_result.confidence_score,
        draft_reply=gemini_result.draft_reply,
        reasoning_summary=gemini_result.reasoning_summary,
        status=guardrail.status,
        guardrail_flags=",".join(guardrail.flags),
        routing_decision=routing_decision,
    )

    ticket = crud.create_ticket(db, ticket)

    # Log
    raw_input_str = (
        f"name={ticket_in.name}; email={ticket_in.email}; "
        f"subject={ticket_in.subject}; message={ticket_in.message}"
    )

    ai_output_str = raw_json or ""
    if gemini_error:
        ai_output_str += f"\nERROR: {gemini_error}"

    crud.create_ticket_log(
        db,
        ticket_id=ticket.id,
        raw_input=raw_input_str,
        ai_output=ai_output_str,
        guardrail_flags=",".join(guardrail.flags),
        routing_decision=routing_decision,
    )

    flags_list = ticket.guardrail_flags.split(",") if ticket.guardrail_flags else []

    return TicketResponse(
        id=ticket.id,
        name=ticket.name,
        email=ticket.email,
        subject=ticket.subject,
        message=ticket.message,
        category=ticket.category,
        urgency=ticket.urgency,
        priority_score=ticket.priority_score,
        confidence_score=ticket.confidence_score,
        draft_reply=ticket.draft_reply,
        reasoning_summary=ticket.reasoning_summary,
        status=ticket.status,
        guardrail_flags=flags_list,
        routing_decision=ticket.routing_decision,
        is_duplicate=ticket.is_duplicate,
        original_ticket_id=ticket.original_ticket_id,
        created_at=ticket.created_at,
    )


@router.get("", response_model=TicketListResponse)
async def list_tickets(
    status: Optional[str] = None,
    urgency: Optional[str] = None,
    db: Session = Depends(get_db),
):
    tickets = crud.list_tickets(db, status=status, urgency=urgency)
    items: List[TicketListItem] = []
    for t in tickets:
        items.append(
            TicketListItem(
                id=t.id,
                name=t.name,
                email=t.email,
                subject=t.subject,
                category=t.category,
                urgency=t.urgency,
                priority_score=t.priority_score,
                confidence_score=t.confidence_score,
                status=t.status,
                created_at=t.created_at,
            )
        )
    return TicketListResponse(items=items)


@router.get("/{ticket_id}/logs", response_model=List[TicketLogEntry])
async def get_ticket_logs(ticket_id: int, db: Session = Depends(get_db)):
    logs = crud.list_ticket_logs(db, ticket_id=ticket_id)
    # Avoid Pydantic v2 from_orm requirements by constructing manually
    return [
        TicketLogEntry(
            id=log.id,
            timestamp=log.timestamp,
            raw_input=log.raw_input,
            ai_output=log.ai_output,
            guardrail_flags=log.guardrail_flags,
            routing_decision=log.routing_decision,
        )
        for log in logs
    ]

