import json
import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.agreement import Agreement
from app.models.project import Project
from app.models.client import Client
from app.models.analysis import Analysis
from app.services.hindsight_service import hindsight_service
from app.services.groq_service import groq_service

logger = logging.getLogger(__name__)


class ScopeService:
    def format_agreement_text(
        self, agreement: Agreement, project_name: str, client_name: str
    ) -> str:
        """Format an Agreement record into a human-readable text block for the AI prompt."""

        def _parse(field) -> list:
            if not field:
                return []
            if isinstance(field, str):
                try:
                    return json.loads(field)
                except (json.JSONDecodeError, ValueError):
                    return [field]
            return field

        deliverables = _parse(agreement.deliverables)
        included = _parse(agreement.included_features)
        excluded = _parse(agreement.excluded_features)

        lines = [
            f"PROJECT: {project_name}",
            f"CLIENT: {client_name}",
            f"DESCRIPTION: {agreement.project_description}",
            "",
            "DELIVERABLES:",
            *[f"  - {d}" for d in deliverables],
            "",
            "INCLUDED FEATURES:",
            *[f"  - {f}" for f in included],
            "",
            "EXCLUDED FEATURES (OUT OF SCOPE):",
            *[f"  - {f}" for f in excluded],
            "",
            f"REVISIONS: {agreement.revisions_allowed} rounds",
        ]
        if agreement.budget:
            lines.append(f"BUDGET: {agreement.budget}")
        if agreement.deadline:
            deadline_str = (
                agreement.deadline.strftime("%Y-%m-%d")
                if hasattr(agreement.deadline, "strftime")
                else str(agreement.deadline)
            )
            lines.append(f"DEADLINE: {deadline_str}")
        if agreement.additional_conditions:
            lines.extend(["", f"ADDITIONAL CONDITIONS: {agreement.additional_conditions}"])

        return "\n".join(lines)

    async def store_agreement_in_hindsight(
        self,
        agreement: Agreement,
        project: Project,
        client: Client,
        db: AsyncSession,
    ) -> bool:
        agreement_text = self.format_agreement_text(
            agreement, project.name, client.name
        )
        await hindsight_service.store_agreement(
            project_id=project.id,
            client_id=client.id,
            project_name=project.name,
            agreement_text=agreement_text,
        )
        agreement.hindsight_stored = True
        # Update bank_id on project
        bank_id = hindsight_service.get_bank_id_for_project(project.id, client.id)
        project.hindsight_bank_id = bank_id
        await db.commit()
        return True

    async def analyze_request(
        self,
        project_id: int,
        client_id: int,
        request_text: str,
        db: AsyncSession,
    ) -> dict:
        # Fetch project and client
        project = await db.get(Project, project_id)
        client = await db.get(Client, client_id)
        if not project or not client:
            raise ValueError("Project or client not found")

        # Fetch the most recent agreement for this project/client
        result = await db.execute(
            select(Agreement)
            .where(
                Agreement.project_id == project_id,
                Agreement.client_id == client_id,
            )
            .order_by(Agreement.created_at.desc())
        )
        agreement = result.scalar_one_or_none()

        if not agreement:
            agreement_text = "No formal agreement found for this project."
        else:
            agreement_text = self.format_agreement_text(
                agreement, project.name, client.name
            )

        # Recall memories from Hindsight
        memories: list[str] = []
        if hindsight_service.is_available:
            memories = await hindsight_service.recall_for_project(
                project_id=project_id,
                client_id=client_id,
                query=request_text,
            )

        # Analyze with Groq
        analysis_result = await groq_service.analyze_scope(
            agreement_text=agreement_text,
            memories=memories,
            new_request=request_text,
        )

        # Persist analysis to database
        analysis = Analysis(
            project_id=project_id,
            client_id=client_id,
            request_text=request_text,
            decision=analysis_result.get("decision", "NEEDS_CLARIFICATION"),
            risk_level=analysis_result.get("risk_level", "MEDIUM"),
            reason=analysis_result.get("reason", ""),
            matched_agreement=json.dumps(
                analysis_result.get("matched_agreement", [])
            ),
            requested_changes=json.dumps(
                analysis_result.get("requested_changes", [])
            ),
            recommendation=analysis_result.get("recommendation", ""),
            suggested_reply=analysis_result.get("suggested_reply", ""),
            suggested_charge=analysis_result.get("suggested_charge"),
            hindsight_recalled_memories=json.dumps(memories),
        )
        db.add(analysis)
        await db.commit()
        await db.refresh(analysis)

        # Store this interaction in Hindsight for future recall
        if hindsight_service.is_available:
            try:
                await hindsight_service.store_analysis_result(
                    project_id=project_id,
                    client_id=client_id,
                    request=request_text,
                    decision=analysis_result.get("decision", "NEEDS_CLARIFICATION"),
                    reason=analysis_result.get("reason", ""),
                )
            except Exception as e:
                logger.warning(f"Failed to store analysis in Hindsight: {e}")

        return {
            **analysis_result,
            "analysis_id": analysis.id,
            "recalled_memories": memories,
            "agreement_text": agreement_text,
        }


scope_service = ScopeService()
