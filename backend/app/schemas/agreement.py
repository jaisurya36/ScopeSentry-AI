from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


class AgreementCreate(BaseModel):
    project_id: int
    client_id: int
    project_description: str
    deliverables: Optional[List[str]] = []
    included_features: Optional[List[str]] = []
    excluded_features: Optional[List[str]] = []
    revisions_allowed: Optional[int] = 2
    budget: Optional[str] = None
    deadline: Optional[date] = None
    additional_conditions: Optional[str] = None


class AgreementUpdate(BaseModel):
    project_description: Optional[str] = None
    deliverables: Optional[List[str]] = None
    included_features: Optional[List[str]] = None
    excluded_features: Optional[List[str]] = None
    revisions_allowed: Optional[int] = None
    budget: Optional[str] = None
    deadline: Optional[date] = None
    additional_conditions: Optional[str] = None


class AgreementResponse(BaseModel):
    id: int
    project_id: int
    client_id: int
    project_description: str
    deliverables: Optional[List[str]] = []
    included_features: Optional[List[str]] = []
    excluded_features: Optional[List[str]] = []
    revisions_allowed: Optional[int] = 2
    budget: Optional[str] = None
    deadline: Optional[date] = None
    additional_conditions: Optional[str] = None
    hindsight_stored: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    project_name: Optional[str] = None
    client_name: Optional[str] = None

    class Config:
        from_attributes = True
