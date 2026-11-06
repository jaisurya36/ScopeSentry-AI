import json
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database.connection import get_db
from app.models.client import Client
from app.models.project import Project
from app.models.agreement import Agreement
from app.models.analysis import Analysis
from app.services.hindsight_service import hindsight_service
from app.services.groq_service import groq_service

logger = logging.getLogger(__name__)
router = APIRouter()


def _serialize_analysis_summary(analysis: Analysis) -> dict:
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
        "request_text": analysis.request_text[:200],
        "decision": decision,
        "risk_level": risk_level,
        "reason": analysis.reason[:300] if analysis.reason else None,
        "created_at": analysis.created_at,
    }


@router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Return aggregate statistics for the dashboard."""
    # Total clients
    total_clients_result = await db.execute(select(func.count(Client.id)))
    total_clients = total_clients_result.scalar() or 0

    # Active projects
    active_projects_result = await db.execute(
        select(func.count(Project.id)).where(Project.status == "active")
    )
    active_projects = active_projects_result.scalar() or 0

    # Total analyses
    total_analyses_result = await db.execute(select(func.count(Analysis.id)))
    requests_analyzed = total_analyses_result.scalar() or 0

    # Decision breakdown
    out_of_scope_result = await db.execute(
        select(func.count(Analysis.id)).where(Analysis.decision == "OUT_OF_SCOPE")
    )
    out_of_scope_requests = out_of_scope_result.scalar() or 0

    in_scope_result = await db.execute(
        select(func.count(Analysis.id)).where(Analysis.decision == "IN_SCOPE")
    )
    in_scope_count = in_scope_result.scalar() or 0

    needs_clarification_result = await db.execute(
        select(func.count(Analysis.id)).where(Analysis.decision == "NEEDS_CLARIFICATION")
    )
    needs_clarification_count = needs_clarification_result.scalar() or 0

    # Risk breakdown
    high_risk_result = await db.execute(
        select(func.count(Analysis.id)).where(Analysis.risk_level == "HIGH")
    )
    medium_risk_result = await db.execute(
        select(func.count(Analysis.id)).where(Analysis.risk_level == "MEDIUM")
    )
    low_risk_result = await db.execute(
        select(func.count(Analysis.id)).where(Analysis.risk_level == "LOW")
    )

    # Recent analyses (last 10)
    recent_result = await db.execute(
        select(Analysis).order_by(Analysis.created_at.desc()).limit(10)
    )
    recent_analyses_raw = recent_result.scalars().all()
    recent_analyses = [_serialize_analysis_summary(a) for a in recent_analyses_raw]

    return {
        "total_clients": total_clients,
        "active_projects": active_projects,
        "requests_analyzed": requests_analyzed,
        "total_analyses": requests_analyzed,
        "out_of_scope_requests": out_of_scope_requests,
        "out_of_scope_count": out_of_scope_requests,
        "in_scope_count": in_scope_count,
        "needs_clarification_count": needs_clarification_count,
        "decision_distribution": {
            "IN_SCOPE": in_scope_count,
            "OUT_OF_SCOPE": out_of_scope_requests,
            "NEEDS_CLARIFICATION": needs_clarification_count,
        },
        "scope_risk_summary": {
            "HIGH": high_risk_result.scalar() or 0,
            "MEDIUM": medium_risk_result.scalar() or 0,
            "LOW": low_risk_result.scalar() or 0,
        },
        "recent_analyses": recent_analyses,
    }


@router.get("/status")
async def get_service_status():
    """Return connection status for Hindsight and Groq services."""
    groq_avail = groq_service.is_available
    hindsight_avail = hindsight_service.is_available
    return {
        "groq_connected": groq_avail,
        "hindsight_connected": hindsight_avail,
        "hindsight": {
            "available": hindsight_avail,
            "message": (
                "Connected"
                if hindsight_avail
                else "Not configured — set HINDSIGHT_API_KEY"
            ),
        },
        "groq": {
            "available": groq_avail,
            "message": (
                "Connected"
                if groq_avail
                else "Not configured — set GROQ_API_KEY"
            ),
        },
        "api_version": "1.0.0",
    }
