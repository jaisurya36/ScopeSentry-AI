import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.database.connection import get_db
from app.models.agreement import Agreement
from app.models.project import Project
from app.models.client import Client
from app.schemas.agreement import AgreementCreate, AgreementUpdate, AgreementResponse
from app.services.hindsight_service import hindsight_service
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


def _serialize_agreement(
    agreement: Agreement,
    project: Optional[Project] = None,
    client: Optional[Client] = None,
) -> dict:
    return {
        "id": agreement.id,
        "project_id": agreement.project_id,
        "client_id": agreement.client_id,
        "project_description": agreement.project_description,
        "deliverables": _parse_json_field(agreement.deliverables),
        "included_features": _parse_json_field(agreement.included_features),
        "excluded_features": _parse_json_field(agreement.excluded_features),
        "revisions_allowed": agreement.revisions_allowed,
        "budget": agreement.budget,
        "deadline": agreement.deadline,
        "additional_conditions": agreement.additional_conditions,
        "hindsight_stored": agreement.hindsight_stored,
        "created_at": agreement.created_at,
        "updated_at": agreement.updated_at,
        "project_name": project.name if project else None,
        "client_name": client.name if client else None,
    }


@router.get("", response_model=List[AgreementResponse], include_in_schema=False)
@router.get("/", response_model=List[AgreementResponse])
async def list_agreements(
    project_id: Optional[int] = Query(None),
    client_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List agreements with optional filters."""
    query = select(Agreement)
    if project_id:
        query = query.where(Agreement.project_id == project_id)
    if client_id:
        query = query.where(Agreement.client_id == client_id)
    query = query.order_by(Agreement.created_at.desc())

    result = await db.execute(query)
    agreements = result.scalars().all()

    output = []
    for agr in agreements:
        project = await db.get(Project, agr.project_id)
        client = await db.get(Client, agr.client_id)
        output.append(_serialize_agreement(agr, project, client))
    return output


@router.post("", response_model=AgreementResponse, include_in_schema=False)
@router.post("/", response_model=AgreementResponse, status_code=status.HTTP_201_CREATED)
async def create_agreement(payload: AgreementCreate, db: AsyncSession = Depends(get_db)):
    """Create an agreement and store it in Hindsight memory. Fails with 503 if Hindsight is unavailable."""
    # Validate project and client
    project = await db.get(Project, payload.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    client = await db.get(Client, payload.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    agreement = Agreement(
        project_id=payload.project_id,
        client_id=payload.client_id,
        project_description=payload.project_description,
        deliverables=json.dumps(payload.deliverables or []),
        included_features=json.dumps(payload.included_features or []),
        excluded_features=json.dumps(payload.excluded_features or []),
        revisions_allowed=payload.revisions_allowed,
        budget=payload.budget,
        deadline=payload.deadline,
        additional_conditions=payload.additional_conditions,
        hindsight_stored=False,
    )
    db.add(agreement)
    await db.commit()
    await db.refresh(agreement)

    # Store in Hindsight — required, fail with 503 if unavailable
    try:
        await scope_service.store_agreement_in_hindsight(agreement, project, client, db)
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Agreement saved to database but Hindsight memory storage failed: {str(e)}. "
                   "Please configure HINDSIGHT_API_KEY and retry.",
        )
    except Exception as e:
        logger.error(f"Unexpected Hindsight error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Agreement saved but memory storage failed unexpectedly: {str(e)}",
        )

    await db.refresh(agreement)
    return _serialize_agreement(agreement, project, client)


@router.get("/{agreement_id}", response_model=AgreementResponse)
async def get_agreement(agreement_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific agreement."""
    agreement = await db.get(Agreement, agreement_id)
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
    project = await db.get(Project, agreement.project_id)
    client = await db.get(Client, agreement.client_id)
    return _serialize_agreement(agreement, project, client)


@router.put("/{agreement_id}", response_model=AgreementResponse)
async def update_agreement(
    agreement_id: int,
    payload: AgreementUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an agreement and re-sync with Hindsight."""
    agreement = await db.get(Agreement, agreement_id)
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field in ("deliverables", "included_features", "excluded_features"):
            setattr(agreement, field, json.dumps(value) if value is not None else "[]")
        else:
            setattr(agreement, field, value)

    agreement.hindsight_stored = False
    await db.commit()
    await db.refresh(agreement)

    project = await db.get(Project, agreement.project_id)
    client = await db.get(Client, agreement.client_id)

    # Re-sync with Hindsight
    try:
        await scope_service.store_agreement_in_hindsight(agreement, project, client, db)
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Agreement updated but Hindsight sync failed: {str(e)}",
        )

    await db.refresh(agreement)
    return _serialize_agreement(agreement, project, client)
