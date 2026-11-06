from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProjectCreate(BaseModel):
    client_id: int
    name: str
    description: Optional[str] = None
    status: Optional[str] = "active"


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class ProjectResponse(BaseModel):
    id: int
    client_id: int
    name: str
    description: Optional[str] = None
    status: str
    hindsight_bank_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    client_name: Optional[str] = None
    client_company: Optional[str] = None
    agreement_count: int = 0
    analysis_count: int = 0

    class Config:
        from_attributes = True
