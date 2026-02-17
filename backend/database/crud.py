from typing import List, Optional
from sqlalchemy.orm import Session

from . import models


def get_ticket_by_hash(db: Session, message_hash: str) -> Optional[models.Ticket]:
    return (
        db.query(models.Ticket)
        .filter(models.Ticket.message_hash == message_hash)
        .order_by(models.Ticket.created_at.desc())
        .first()
    )


def create_ticket(db: Session, ticket: models.Ticket) -> models.Ticket:
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


def create_ticket_log(
    db: Session,
    *,
    ticket_id: int,
    raw_input: str,
    ai_output: Optional[str],
    guardrail_flags: Optional[str],
    routing_decision: Optional[str],
) -> models.TicketLog:
    log = models.TicketLog(
        ticket_id=ticket_id,
        raw_input=raw_input,
        ai_output=ai_output,
        guardrail_flags=guardrail_flags,
        routing_decision=routing_decision,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def list_tickets(
    db: Session,
    *,
    status: Optional[str] = None,
    urgency: Optional[str] = None,
    limit: int = 50,
) -> List[models.Ticket]:
    query = db.query(models.Ticket).order_by(models.Ticket.created_at.desc())
    if status:
        query = query.filter(models.Ticket.status == status)
    if urgency:
        query = query.filter(models.Ticket.urgency == urgency)
    return query.limit(limit).all()


def list_ticket_logs(db: Session, ticket_id: int) -> List[models.TicketLog]:
    return (
        db.query(models.TicketLog)
        .filter(models.TicketLog.ticket_id == ticket_id)
        .order_by(models.TicketLog.timestamp.asc())
        .all()
    )

