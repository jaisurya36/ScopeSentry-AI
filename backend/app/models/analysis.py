from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base
import enum


class DecisionEnum(str, enum.Enum):
    IN_SCOPE = "IN_SCOPE"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"
    NEEDS_CLARIFICATION = "NEEDS_CLARIFICATION"


class RiskLevelEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    request_text = Column(Text, nullable=False)
    decision = Column(
        SAEnum(DecisionEnum),
        default=DecisionEnum.NEEDS_CLARIFICATION,
        nullable=False,
    )
    risk_level = Column(
        SAEnum(RiskLevelEnum),
        default=RiskLevelEnum.MEDIUM,
        nullable=False,
    )
    reason = Column(Text, nullable=True)
    # JSON stored as Text
    matched_agreement = Column(Text, nullable=True)           # JSON array
    requested_changes = Column(Text, nullable=True)           # JSON array
    recommendation = Column(Text, nullable=True)
    suggested_reply = Column(Text, nullable=True)
    suggested_charge = Column(String(255), nullable=True)
    hindsight_recalled_memories = Column(Text, nullable=True)  # JSON array
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project = relationship("Project", back_populates="analyses")
    client = relationship("Client", back_populates="analyses")
