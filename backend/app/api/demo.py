import json
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.connection import get_db
from app.models.client import Client
from app.models.project import Project
from app.models.agreement import Agreement
from app.models.analysis import Analysis
from app.services.hindsight_service import hindsight_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/setup")
async def setup_demo_scenario(db: AsyncSession = Depends(get_db)):
    """One-click demo scenario setup for judges.

    Creates:
    1. Client: Acme Technologies
    2. Project: Corporate Website Development
    3. Agreement: 5 pages, responsive design, contact form, 2 revisions, NO payment gateway, NO CRM, Budget: ₹50,000
    4. Stores agreement in Hindsight memory
    5. Seeds realistic historical interactions in DB and Hindsight memory
    """
    try:
        # Check if Acme Technologies already exists
        result = await db.execute(select(Client).where(Client.name == "Acme Technologies"))
        client = result.scalar_one_or_none()

        if not client:
            client = Client(
                name="Acme Technologies",
                company="Acme Corp Global",
                email="contact@acmetechnologies.demo",
            )
            db.add(client)
            await db.commit()
            await db.refresh(client)

        # Check if Project exists
        proj_result = await db.execute(
            select(Project).where(
                Project.client_id == client.id,
                Project.name == "Corporate Website Development",
            )
        )
        project = proj_result.scalar_one_or_none()

        bank_id = f"scopesentry-project-demo-acme"
        if not project:
            project = Project(
                client_id=client.id,
                name="Corporate Website Development",
                description="Corporate website development with 5 pages, responsive design, contact form, and 2 revision rounds.",
                status="active",
                hindsight_bank_id=bank_id,
            )
            db.add(project)
            await db.commit()
            await db.refresh(project)

        # Update bank_id to actual project id if needed
        actual_bank_id = hindsight_service.get_bank_id_for_project(project.id, client.id)
        project.hindsight_bank_id = actual_bank_id
        await db.commit()

        # Check or create Agreement
        agree_result = await db.execute(
            select(Agreement).where(
                Agreement.project_id == project.id,
                Agreement.client_id == client.id,
            )
        )
        agreement = agree_result.scalar_one_or_none()

        deliverables = [
            "Homepage with hero section & company overview",
            "About Us page with team & history",
            "Services page detailing 4 core offerings",
            "Case Studies portfolio page",
            "Contact Us page with interactive inquiry form",
        ]

        included_features = [
            "5 standard pages",
            "Mobile-responsive layout",
            "Standard contact form with email notifications",
            "SEO meta tags for all 5 pages",
            "Two (2) revision rounds per deliverable",
        ]

        excluded_features = [
            "Payment gateway integration (Stripe, Razorpay, PayPal)",
            "Customer Management Module / CRM integration",
            "User registration & login authentication",
            "Multilingual / localization support",
            "Custom backend API integrations beyond contact form",
        ]

        if not agreement:
            agreement = Agreement(
                project_id=project.id,
                client_id=client.id,
                project_description="Design and development of a modern 5-page corporate website for Acme Technologies.",
                deliverables=json.dumps(deliverables),
                included_features=json.dumps(included_features),
                excluded_features=json.dumps(excluded_features),
                revisions_allowed=2,
                budget="₹50,000",
                deadline=datetime.utcnow() + timedelta(days=30),
                additional_conditions="Any page additions or payment gateway implementations require a formal scope change request and additional billing.",
                hindsight_stored=False,
            )
            db.add(agreement)
            await db.commit()
            await db.refresh(agreement)

        # Format agreement text for Hindsight
        agreement_text = (
            f"PROJECT AGREEMENT: Corporate Website Development for Acme Technologies\n"
            f"Budget: ₹50,000 | Revisions: 2 rounds\n"
            f"Deliverables:\n" + "\n".join([f"  - {d}" for d in deliverables]) + "\n"
            f"Included Features:\n" + "\n".join([f"  - {f}" for f in included_features]) + "\n"
            f"Explicitly Excluded Features (OUT OF SCOPE):\n" + "\n".join([f"  - {e}" for e in excluded_features]) + "\n"
            f"Conditions: Payment gateway integration and CRM features are strictly out of scope and require extra budget."
        )

        # Store in Hindsight if available
        hindsight_status = "Hindsight client not configured"
        hindsight_stored_items = []
        if hindsight_service.is_available:
            try:
                await hindsight_service.ensure_bank_exists(actual_bank_id, f"Acme Technologies - Corporate Website")
                
                # Interaction 1: Original agreement
                await hindsight_service.retain(
                    actual_bank_id,
                    f"SIGNED AGREEMENT (Interaction 1):\n{agreement_text}"
                )
                hindsight_stored_items.append("Interaction 1: Signed Agreement retained")

                # Interaction 2: Historical request regarding payment gateway
                await hindsight_service.retain(
                    actual_bank_id,
                    "CLIENT DISCUSSION (Interaction 2): Acme requested adding Razorpay gateway. Agency informed Acme that payment gateways were excluded from the ₹50,000 scope and would cost ₹15,000 extra."
                )
                hindsight_stored_items.append("Interaction 2: Discussion regarding payment gateway retained")

                # Interaction 3: Scope decision on payment gateway
                await hindsight_service.retain(
                    actual_bank_id,
                    "SCOPE DECISION (Interaction 3): Payment Gateway request was formally categorized OUT_OF_SCOPE. Client acknowledged and deferred payment feature to Phase 2."
                )
                hindsight_stored_items.append("Interaction 3: Formal OUT_OF_SCOPE decision on payment gateway retained")

                # Interaction 4: Revision round note
                await hindsight_service.retain(
                    actual_bank_id,
                    "PROJECT STATUS (Interaction 4): Client has completed 1 out of 2 agreed revision rounds on the homepage mockup. 1 revision round remains."
                )
                hindsight_stored_items.append("Interaction 4: Revision limit status retained")

                agreement.hindsight_stored = True
                await db.commit()
                hindsight_status = "All 4 demo memories successfully retained in Hindsight persistent memory!"
            except Exception as e:
                logger.error(f"Failed to seed memories in Hindsight: {e}")
                hindsight_status = f"Hindsight retain error: {str(e)}"

        # Seed realistic analysis records in SQLite if not present
        existing_analyses = await db.execute(
            select(Analysis).where(Analysis.project_id == project.id)
        )
        if not existing_analyses.scalars().first():
            # Seed Interaction 2 / 3 as prior analysis
            past_analysis = Analysis(
                project_id=project.id,
                client_id=client.id,
                request_text="Can we add an online payment gateway so customers can pay directly on the website?",
                decision="OUT_OF_SCOPE",
                risk_level="HIGH",
                reason="Payment gateway integration (Stripe, Razorpay, PayPal) is explicitly listed under Excluded Features in the original agreement. The agreed scope is strictly a 5-page informational corporate site.",
                matched_agreement=json.dumps(["Payment gateway integration (Stripe, Razorpay, PayPal)"]),
                requested_changes=json.dumps(["Add Razorpay/Stripe payment gateway", "Customer transaction processing"]),
                recommendation="Propose a Phase 2 Scope Change Order with an estimated fee of ₹15,000 - ₹20,000.",
                suggested_reply="Dear Acme Technologies team, thank you for reaching out! Online payment gateway functionality is currently excluded under our signed agreement for the Corporate Website (₹50,000). We would love to implement this for you as a Scope Extension. We can prepare a separate proposal for ₹15,000 covering Razorpay integration. Let us know if you'd like us to proceed!",
                suggested_charge="₹15,000 - ₹20,000",
                hindsight_recalled_memories=json.dumps([
                    "SIGNED AGREEMENT: Corporate Website Development (5 pages, no payment gateway)",
                    "EXCLUDED: Payment gateway integration (Stripe, Razorpay, PayPal)"
                ]),
            )
            db.add(past_analysis)
            await db.commit()

        return {
            "success": True,
            "message": "Acme Technologies demo environment initialized successfully!",
            "client_id": client.id,
            "project_id": project.id,
            "agreement_id": agreement.id,
            "bank_id": actual_bank_id,
            "hindsight_status": hindsight_status,
            "hindsight_memories_stored": hindsight_stored_items,
            "scenario": {
                "client": "Acme Technologies",
                "project": "Corporate Website Development",
                "budget": "₹50,000",
                "included": included_features,
                "excluded": excluded_features,
                "suggested_demo_prompt": "Please add an online payment gateway and three additional pages.",
            },
        }
    except Exception as e:
        logger.exception("Error setting up demo scenario")
        raise HTTPException(status_code=500, detail=str(e))
