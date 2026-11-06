from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    projects = relationship(
        "Project", back_populates="client", cascade="all, delete-orphan"
    )
    agreements = relationship(
        "Agreement", back_populates="client", cascade="all, delete-orphan"
    )
    analyses = relationship(
        "Analysis", back_populates="client", cascade="all, delete-orphan"
    )
