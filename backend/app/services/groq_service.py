import json
import logging
from typing import List, Optional
from groq import AsyncGroq
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
        self._init_client()

    def _init_client(self):
        if not settings.groq_api_key:
            logger.warning("GROQ_API_KEY not set")
            return
        try:
            self._client = AsyncGroq(api_key=settings.groq_api_key)
            self._available = True
            logger.info("Groq client initialized")
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
                model="llama-3.3-70b-versatile",
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
            return result
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
        response = await self._client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.3,
            max_tokens=1000,
        )
        return response.choices[0].message.content


groq_service = GroqService()
