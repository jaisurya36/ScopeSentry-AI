from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class AnalysisRequest(BaseModel):
    project_id: int
    client_id: int
    request_text: str


class AnalysisResult(BaseModel):
    decision: str  # IN_SCOPE | OUT_OF_SCOPE | NEEDS_CLARIFICATION
    risk_level: str  # LOW | MEDIUM | HIGH
    reason: str
    matched_agreement: List[str] = []
    requested_changes: List[str] = []
    recommendation: str
    suggested_reply: str
    suggested_charge: Optional[str] = None
    # Extended fields returned by API
    analysis_id: Optional[int] = None
    recalled_memories: Optional[List[str]] = []
    agreement_text: Optional[str] = None

    class Config:
        from_attributes = True


class AnalysisResponse(BaseModel):
    id: int
    project_id: int
    client_id: int
    request_text: str
    decision: str
    risk_level: str
    reason: Optional[str] = None
    matched_agreement: Optional[List[str]] = []
    requested_changes: Optional[List[str]] = []
    recommendation: Optional[str] = None
    suggested_reply: Optional[str] = None
    suggested_charge: Optional[str] = None
    hindsight_recalled_memories: Optional[List[str]] = []
    created_at: Optional[datetime] = None
    project_name: Optional[str] = None
    client_name: Optional[str] = None

    class Config:
        from_attributes = True
