from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from app.database.connection import get_db
from app.models.project import Project, ProjectStatus
from app.models.client import Client
from app.models.agreement import Agreement
from app.models.analysis import Analysis
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter()


def _serialize_project(
    project: Project,
    client: Optional[Client] = None,
    agreement_count: int = 0,
    analysis_count: int = 0,
) -> dict:
    status_val = (
        project.status.value if hasattr(project.status, "value") else project.status
    )
    return {
        "id": project.id,
        "client_id": project.client_id,
        "name": project.name,
        "description": project.description,
        "status": status_val,
        "hindsight_bank_id": project.hindsight_bank_id,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "client_name": client.name if client else None,
        "client_company": client.company if client else None,
        "agreement_count": agreement_count,
        "analysis_count": analysis_count,
    }


@router.get("", response_model=List[ProjectResponse], include_in_schema=False)
@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    client_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List projects with optional client_id and status filters."""
    query = select(Project)
    if client_id:
        query = query.where(Project.client_id == client_id)
    if status:
        query = query.where(Project.status == status)
    query = query.order_by(Project.created_at.desc())

    result = await db.execute(query)
    projects = result.scalars().all()

    # Batch-load clients
    client_ids = list({p.client_id for p in projects})
    clients_result = await db.execute(
        select(Client).where(Client.id.in_(client_ids))
    )
    clients_map = {c.id: c for c in clients_result.scalars().all()}

    return [
        _serialize_project(p, clients_map.get(p.client_id))
        for p in projects
    ]


@router.post("", response_model=ProjectResponse, include_in_schema=False)
@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(payload: ProjectCreate, db: AsyncSession = Depends(get_db)):
    """Create a new project."""
    client = await db.get(Client, payload.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Map string status to enum
    try:
        project_status = ProjectStatus(payload.status or "active")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{payload.status}'. Must be one of: active, completed, on_hold",
        )

    project = Project(
        client_id=payload.client_id,
        name=payload.name,
        description=payload.description,
        status=project_status,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return _serialize_project(project, client)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    """Get a project with client details."""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    client = await db.get(Client, project.client_id)

    agreement_count_result = await db.execute(
        select(func.count(Agreement.id)).where(Agreement.project_id == project_id)
    )
    analysis_count_result = await db.execute(
        select(func.count(Analysis.id)).where(Analysis.project_id == project_id)
    )

    return _serialize_project(
        project,
        client,
        agreement_count=agreement_count_result.scalar() or 0,
        analysis_count=analysis_count_result.scalar() or 0,
    )


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a project."""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"]:
        try:
            update_data["status"] = ProjectStatus(update_data["status"])
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status value")

    for field, value in update_data.items():
        setattr(project, field, value)

    await db.commit()
    await db.refresh(project)
    client = await db.get(Client, project.client_id)
    return _serialize_project(project, client)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a project and all its data."""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)
    await db.commit()
