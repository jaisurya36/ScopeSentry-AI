from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base


class Agreement(Base):
    __tablename__ = "agreements"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    project_description = Column(Text, nullable=False)
    # JSON stored as Text
    deliverables = Column(Text, nullable=True)           # JSON array
    included_features = Column(Text, nullable=True)      # JSON array
    excluded_features = Column(Text, nullable=True)      # JSON array
    revisions_allowed = Column(Integer, default=2)
    budget = Column(String(255), nullable=True)
    deadline = Column(Date, nullable=True)
    additional_conditions = Column(Text, nullable=True)
    hindsight_stored = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    project = relationship("Project", back_populates="agreements")
    client = relationship("Client", back_populates="agreements")
