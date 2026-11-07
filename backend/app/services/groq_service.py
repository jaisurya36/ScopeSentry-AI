import json
import logging
from typing import List, Optional
from groq import (
    AsyncGroq,
    NotFoundError,
    AuthenticationError,
    RateLimitError,
    APIConnectionError,
    APITimeoutError,
    APIStatusError,
    GroqError,
)
from app.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are ScopeSentry AI, an expert scope management assistant for freelancers and agencies.
Your job is to analyze client requests against original project agreements and determine if the request is in-scope, out-of-scope, or needs clarification.

Rules:
- Never invent agreement details. If agreement is unclear or unavailable, return NEEDS_CLARIFICATION.
- Base your decision ONLY on the provided agreement and memories.
- Be precise and professional in your analysis.
- When calculating suggested charges, only do so if budget information is available.
- Always provide a professional, diplomatic suggested reply to the client.

Return ONLY valid JSON matching this exact schema:
{
  "decision": "IN_SCOPE" | "OUT_OF_SCOPE" | "NEEDS_CLARIFICATION",
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "reason": "Detailed explanation of the decision",
  "matched_agreement": ["List of relevant agreement clauses"],
  "requested_changes": ["List of changes the client is requesting"],
  "recommendation": "What action to take",
  "suggested_reply": "Professional response to send to the client",
  "suggested_charge": "Optional additional charge estimate or null"
}
"""


class GroqService:
    def __init__(self):
        self._client = None
        self._available = False
        self.model = settings.groq_model or "openai/gpt-oss-120b"
        self._init_client()

    def _init_client(self):
        if not settings.groq_api_key:
            logger.warning("GROQ_API_KEY not set")
            return
        try:
            self._client = AsyncGroq(api_key=settings.groq_api_key)
            self._available = True
            logger.info("Groq client initialized with model: %s", self.model)
        except Exception as e:
            logger.error(f"Failed to initialize Groq: {e}")

    @property
    def is_available(self) -> bool:
        return self._available

    async def analyze_scope(
        self,
        agreement_text: str,
        memories: List[str],
        new_request: str,
    ) -> dict:
        if not self._available:
            raise RuntimeError(
                "Groq API is not configured. Please set GROQ_API_KEY."
            )

        memories_text = (
            "\n".join([f"- {m}" for m in memories])
            if memories
            else "No previous interactions recorded."
        )

        user_prompt = f"""ORIGINAL PROJECT AGREEMENT:
{agreement_text}

PREVIOUS CLIENT INTERACTIONS & MEMORY:
{memories_text}

NEW CLIENT REQUEST:
{new_request}

Analyze whether this new request is in-scope, out-of-scope, or needs clarification based on the agreement above.
Return your analysis as valid JSON."""

        try:
            response = await self._client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.1,
                max_tokens=2000,
                response_format={"type": "json_object"},
            )
            content = response.choices[0].message.content
            result = json.loads(content)

            # Validate and normalize core fields for schema conformity
            decision = str(result.get("decision", "NEEDS_CLARIFICATION")).upper()
            if decision not in ("IN_SCOPE", "OUT_OF_SCOPE", "NEEDS_CLARIFICATION"):
                decision = "NEEDS_CLARIFICATION"

            risk_level = str(result.get("risk_level", "MEDIUM")).upper()
            if risk_level not in ("LOW", "MEDIUM", "HIGH"):
                risk_level = "MEDIUM"

            return {
                "decision": decision,
                "risk_level": risk_level,
                "reason": result.get("reason", "No reason provided."),
                "matched_agreement": result.get("matched_agreement", []) if isinstance(result.get("matched_agreement"), list) else [str(result.get("matched_agreement"))],
                "requested_changes": result.get("requested_changes", []) if isinstance(result.get("requested_changes"), list) else [str(result.get("requested_changes"))],
                "recommendation": result.get("recommendation", "Review request with client."),
                "suggested_reply": result.get("suggested_reply", "Thank you for your request. We will review this shortly."),
                "suggested_charge": result.get("suggested_charge"),
            }
        except NotFoundError as e:
            logger.error(f"Groq model '{self.model}' not found: {e}")
            raise RuntimeError(
                f"Groq model '{self.model}' not found or is deprecated. Please check model configuration: {e.message}"
            )
        except AuthenticationError as e:
            logger.error(f"Groq authentication error: {e}")
            raise RuntimeError("Invalid GROQ_API_KEY. Please verify your Groq API credentials.")
        except RateLimitError as e:
            logger.error(f"Groq rate limit exceeded: {e}")
            raise RuntimeError("Groq API rate limit reached. Please wait a moment and retry.")
        except (APIConnectionError, APITimeoutError) as e:
            logger.error(f"Groq connection/timeout error: {e}")
            raise RuntimeError(f"Could not connect to Groq API: {str(e)}")
        except APIStatusError as e:
            logger.error(f"Groq API returned status {e.status_code}: {e.message}")
            raise RuntimeError(f"Groq API error ({e.status_code}): {e.message}")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Groq response as JSON: {e}")
            raise RuntimeError(f"AI response parsing failed: {str(e)}")
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            raise RuntimeError(f"AI analysis failed: {str(e)}")

    async def generate_text(self, prompt: str, system: Optional[str] = None) -> str:
        """General-purpose text generation helper."""
        if not self._available:
            raise RuntimeError("Groq API is not configured. Please set GROQ_API_KEY.")
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        try:
            response = await self._client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.3,
                max_tokens=1000,
            )
            return response.choices[0].message.content
        except NotFoundError as e:
            logger.error(f"Groq model '{self.model}' not found: {e}")
            raise RuntimeError(f"Groq model '{self.model}' not found: {e.message}")
        except Exception as e:
            logger.error(f"Groq text generation error: {e}")
            raise RuntimeError(f"Groq text generation failed: {str(e)}")


groq_service = GroqService()
