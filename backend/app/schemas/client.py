from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class ClientCreate(BaseModel):
    name: str
    company: Optional[str] = None
    email: Optional[str] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[str] = None


class ProjectSummary(BaseModel):
    id: int
    name: str
    status: str

    class Config:
        from_attributes = True


class ClientResponse(BaseModel):
    id: int
    name: str
    company: Optional[str] = None
    email: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    project_count: int = 0
    projects: Optional[List[ProjectSummary]] = None

    class Config:
        from_attributes = True
