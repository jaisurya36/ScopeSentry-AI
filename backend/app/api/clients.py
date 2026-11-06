from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from app.database.connection import get_db
from app.models.client import Client
from app.models.project import Project
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse

router = APIRouter()


def _serialize_client(client: Client, project_count: int = 0) -> dict:
    return {
        "id": client.id,
        "name": client.name,
        "company": client.company,
        "email": client.email,
        "created_at": client.created_at,
        "updated_at": client.updated_at,
        "project_count": project_count,
        "projects": None,
    }


@router.get("", response_model=List[ClientResponse], include_in_schema=False)
@router.get("/", response_model=List[ClientResponse])
async def list_clients(db: AsyncSession = Depends(get_db)):
    """List all clients with their project counts."""
    result = await db.execute(select(Client).order_by(Client.created_at.desc()))
    clients = result.scalars().all()

    # Fetch project counts in one query
    count_result = await db.execute(
        select(Project.client_id, func.count(Project.id).label("cnt"))
        .group_by(Project.client_id)
    )
    counts = {row.client_id: row.cnt for row in count_result}

    return [_serialize_client(c, counts.get(c.id, 0)) for c in clients]


@router.post("", response_model=ClientResponse, include_in_schema=False)
@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(payload: ClientCreate, db: AsyncSession = Depends(get_db)):
    """Create a new client."""
    # Check for duplicate email
    if payload.email:
        existing = await db.execute(
            select(Client).where(Client.email == payload.email)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A client with email '{payload.email}' already exists.",
            )

    client = Client(**payload.model_dump())
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return _serialize_client(client, 0)


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(client_id: int, db: AsyncSession = Depends(get_db)):
    """Get a client with their projects."""
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    projects_result = await db.execute(
        select(Project).where(Project.client_id == client_id)
    )
    projects = projects_result.scalars().all()
    project_summaries = [
        {"id": p.id, "name": p.name, "status": p.status.value if hasattr(p.status, 'value') else p.status}
        for p in projects
    ]

    data = _serialize_client(client, len(projects))
    data["projects"] = project_summaries
    return data


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: int,
    payload: ClientUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a client."""
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)

    await db.commit()
    await db.refresh(client)

    # Get project count
    count_result = await db.execute(
        select(func.count(Project.id)).where(Project.client_id == client_id)
    )
    project_count = count_result.scalar() or 0
    return _serialize_client(client, project_count)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(client_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a client and all associated data."""
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    await db.delete(client)
    await db.commit()
