import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.database.connection import get_db
from app.models.analysis import Analysis
from app.models.project import Project
from app.models.client import Client
from app.schemas.analysis import AnalysisRequest, AnalysisResult, AnalysisResponse
from app.services.scope_service import scope_service

logger = logging.getLogger(__name__)
router = APIRouter()


def _parse_json_field(field) -> list:
    if not field:
        return []
    if isinstance(field, str):
        try:
            return json.loads(field)
        except (json.JSONDecodeError, ValueError):
            return []
    return field


def _serialize_analysis(
    analysis: Analysis,
    project: Optional[Project] = None,
    client: Optional[Client] = None,
) -> dict:
    decision = (
        analysis.decision.value
        if hasattr(analysis.decision, "value")
        else analysis.decision
    )
    risk_level = (
        analysis.risk_level.value
        if hasattr(analysis.risk_level, "value")
        else analysis.risk_level
    )
    return {
        "id": analysis.id,
        "project_id": analysis.project_id,
        "client_id": analysis.client_id,
        "request_text": analysis.request_text,
        "decision": decision,
        "risk_level": risk_level,
        "reason": analysis.reason,
        "matched_agreement": _parse_json_field(analysis.matched_agreement),
        "requested_changes": _parse_json_field(analysis.requested_changes),
        "recommendation": analysis.recommendation,
        "suggested_reply": analysis.suggested_reply,
        "suggested_charge": analysis.suggested_charge,
        "hindsight_recalled_memories": _parse_json_field(
            analysis.hindsight_recalled_memories
        ),
        "created_at": analysis.created_at,
        "project_name": project.name if project else None,
        "client_name": client.name if client else None,
    }


@router.post("/analyze", response_model=AnalysisResult)
async def analyze_request(
    payload: AnalysisRequest,
    db: AsyncSession = Depends(get_db),
):
    """Analyze a client request against project agreement using Groq AI + Hindsight memory."""
    try:
        result = await scope_service.analyze_request(
            project_id=payload.project_id,
            client_id=payload.client_id,
            request_text=payload.request_text,
            db=db,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error during analysis")
        raise HTTPException(
            status_code=500, detail=f"Analysis failed: {str(e)}"
        )


@router.get("/analyses", response_model=List[AnalysisResponse])
async def list_analyses(
    project_id: Optional[int] = Query(None),
    client_id: Optional[int] = Query(None),
    decision: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """List analyses with optional filters."""
    query = select(Analysis)
    if project_id:
        query = query.where(Analysis.project_id == project_id)
    if client_id:
        query = query.where(Analysis.client_id == client_id)
    if decision:
        query = query.where(Analysis.decision == decision)
    query = query.order_by(Analysis.created_at.desc()).limit(limit)

    result = await db.execute(query)
    analyses = result.scalars().all()

    output = []
    for a in analyses:
        project = await db.get(Project, a.project_id)
        client = await db.get(Client, a.client_id)
        output.append(_serialize_analysis(a, project, client))
    return output


@router.get("/analyses/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific analysis by ID."""
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    project = await db.get(Project, analysis.project_id)
    client = await db.get(Client, analysis.client_id)
    return _serialize_analysis(analysis, project, client)
