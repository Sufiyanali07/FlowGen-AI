from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from .session import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)

    message_hash = Column(String(128), nullable=False, index=True)
    is_duplicate = Column(Boolean, default=False, nullable=False)
    original_ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True)

    category = Column(String(50), nullable=True)
    urgency = Column(String(50), nullable=True)
    priority_score = Column(Integer, nullable=True)
    confidence_score = Column(Float, nullable=True)

    draft_reply = Column(Text, nullable=True)
    reasoning_summary = Column(Text, nullable=True)

    status = Column(String(50), nullable=False, default="Needs Human Review")
    guardrail_flags = Column(Text, nullable=True)
    routing_decision = Column(String(50), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    original_ticket = relationship("Ticket", remote_side=[id])
    logs = relationship("TicketLog", back_populates="ticket", cascade="all, delete-orphan")


class TicketLog(Base):
    __tablename__ = "ticket_logs"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False, index=True)

    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    raw_input = Column(Text, nullable=False)
    ai_output = Column(Text, nullable=True)
    guardrail_flags = Column(Text, nullable=True)
    routing_decision = Column(String(50), nullable=True)

    ticket = relationship("Ticket", back_populates="logs")

