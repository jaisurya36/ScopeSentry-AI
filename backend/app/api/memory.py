import logging
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from app.database.connection import get_db
from app.models.project import Project
from app.models.client import Client
from app.services.hindsight_service import hindsight_service

logger = logging.getLogger(__name__)
router = APIRouter()


class MemorySearchRequest(BaseModel):
    query: str


@router.get("/status")
async def get_memory_status():
    """Check Hindsight connection status."""
    return {
        "hindsight_available": hindsight_service.is_available,
        "message": (
            "Hindsight memory service is active"
            if hindsight_service.is_available
            else "Hindsight is not configured. Set HINDSIGHT_API_KEY to enable memory features."
        ),
    }


@router.get("/{project_id}/{client_id}")
async def get_project_memories(
    project_id: int,
    client_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all stored memories for a project/client pair."""
    if not hindsight_service.is_available:
        raise HTTPException(
            status_code=503,
            detail="Hindsight memory service is not available. Please configure HINDSIGHT_API_KEY.",
        )

    # Validate project and client exist
    project = await db.get(Project, project_id)
    client = await db.get(Client, client_id)
    if not project or not client:
        raise HTTPException(status_code=404, detail="Project or client not found")

    memories = await hindsight_service.recall_all_project_memories(project_id, client_id)
    bank_id = hindsight_service.get_bank_id_for_project(project_id, client_id)

    return {
        "project_id": project_id,
        "client_id": client_id,
        "project_name": project.name,
        "client_name": client.name,
        "bank_id": bank_id,
        "memories": memories,
        "count": len(memories),
    }


@router.post("/{project_id}/{client_id}/search")
async def search_memories(
    project_id: int,
    client_id: int,
    body: MemorySearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """Search memories for a project with a specific query."""
    if not hindsight_service.is_available:
        raise HTTPException(
            status_code=503,
            detail="Hindsight memory service is not available.",
        )

    project = await db.get(Project, project_id)
    client = await db.get(Client, client_id)
    if not project or not client:
        raise HTTPException(status_code=404, detail="Project or client not found")

    memories = await hindsight_service.recall_for_project(
        project_id=project_id,
        client_id=client_id,
        query=body.query,
    )

    return {
        "project_id": project_id,
        "client_id": client_id,
        "query": body.query,
        "memories": memories,
        "count": len(memories),
    }


@router.post("/demo/setup")
async def setup_demo_memories(db: AsyncSession = Depends(get_db)):
    """Store demo memories in Hindsight for testing."""
    if not hindsight_service.is_available:
        raise HTTPException(
            status_code=503,
            detail="Hindsight is not available. Configure HINDSIGHT_API_KEY first.",
        )

    demo_memories = [
        "CLIENT AGREEMENT: The project scope includes a 5-page marketing website with contact form, about page, services page, and blog.",
        "SCOPE DECISION: Client requested a custom e-commerce checkout was marked OUT_OF_SCOPE as the original agreement only covers a marketing site.",
        "SCOPE DECISION: Adding Google Analytics integration was marked IN_SCOPE as tracking and analytics was listed in included features.",
        "CLIENT NOTE: Client prefers weekly progress updates via email. Agreed on 2 revision rounds per deliverable.",
    ]

    stored = 0
    errors = []
    demo_bank_id = "scopesentry-demo-bank"

    await hindsight_service.ensure_bank_exists(demo_bank_id, "ScopeSentry Demo")
    for memory in demo_memories:
        try:
            await hindsight_service.retain(demo_bank_id, memory)
            stored += 1
        except Exception as e:
            errors.append(str(e))

    return {
        "success": len(errors) == 0,
        "stored_count": stored,
        "total": len(demo_memories),
        "errors": errors,
        "bank_id": demo_bank_id,
    }
