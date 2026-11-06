import logging
from typing import Optional, List
from app.config import settings

logger = logging.getLogger(__name__)


class HindsightService:
    def __init__(self):
        self._client = None
        self._available = False
        self._init_client()

    def _init_client(self):
        if not settings.hindsight_api_key:
            logger.warning("HINDSIGHT_API_KEY not set - memory features disabled")
            return
        try:
            from hindsight_client import Hindsight

            self._client = Hindsight(
                base_url=settings.hindsight_base_url,
                api_key=settings.hindsight_api_key,
            )
            self._available = True
            logger.info("Hindsight client initialized successfully")
        except ImportError:
            logger.error("hindsight-client package not installed. Run: pip install hindsight-client")
        except Exception as e:
            logger.error(f"Failed to initialize Hindsight: {e}")

    @property
    def is_available(self) -> bool:
        return self._available

    def _get_bank_id(self, project_id: int, client_id: int) -> str:
        return f"scopesentry-project-{project_id}-client-{client_id}"

    async def ensure_bank_exists(self, bank_id: str, name: str) -> bool:
        if not self._available:
            return False
        try:
            # Try to create bank - if it already exists, the exception is ignored
            try:
                self._client.create_bank(bank_id=bank_id, name=name)
                logger.info(f"Created Hindsight bank: {bank_id}")
            except Exception:
                # Bank may already exist — that's fine
                pass
            return True
        except Exception as e:
            logger.error(f"Failed to ensure bank exists: {e}")
            return False

    async def retain(self, bank_id: str, content: str) -> bool:
        if not self._available:
            raise RuntimeError(
                "Hindsight is not available. Please configure HINDSIGHT_API_KEY."
            )
        try:
            await self._client.aretain(bank_id=bank_id, content=content)
            logger.info(f"Memory retained in bank {bank_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to retain memory: {e}")
            raise RuntimeError(f"Failed to store memory in Hindsight: {str(e)}")

    async def recall(self, bank_id: str, query: str, top_k: int = 10) -> List[str]:
        if not self._available:
            return []
        try:
            result = await self._client.arecall(bank_id=bank_id, query=query)
            memories = [m.text for m in result.results] if result.results else []
            logger.info(f"Recalled {len(memories)} memories from bank {bank_id}")
            return memories
        except Exception as e:
            logger.error(f"Failed to recall memories: {e}")
            return []

    async def reflect(self, bank_id: str, query: str) -> Optional[str]:
        if not self._available:
            return None
        try:
            result = await self._client.areflect(bank_id=bank_id, query=query)
            if hasattr(result, "text") and result.text:
                return result.text
            elif hasattr(result, "reflection"):
                return result.reflection
            elif hasattr(result, "content"):
                return result.content
            return str(result) if result else None
        except Exception as e:
            logger.error(f"Failed to reflect: {e}")
            return None

    async def store_agreement(
        self,
        project_id: int,
        client_id: int,
        project_name: str,
        agreement_text: str,
    ) -> bool:
        bank_id = self._get_bank_id(project_id, client_id)
        bank_name = f"{project_name} - ScopeSentry"
        await self.ensure_bank_exists(bank_id, bank_name)
        content = f"PROJECT AGREEMENT\n{agreement_text}"
        return await self.retain(bank_id, content)

    async def store_analysis_result(
        self,
        project_id: int,
        client_id: int,
        request: str,
        decision: str,
        reason: str,
    ) -> bool:
        bank_id = self._get_bank_id(project_id, client_id)
        content = (
            f"SCOPE ANALYSIS\n"
            f"Client Request: {request}\n"
            f"Decision: {decision}\n"
            f"Reason: {reason}"
        )
        return await self.retain(bank_id, content)

    async def recall_for_project(
        self, project_id: int, client_id: int, query: str
    ) -> List[str]:
        bank_id = self._get_bank_id(project_id, client_id)
        return await self.recall(bank_id, query)

    async def recall_all_project_memories(
        self, project_id: int, client_id: int
    ) -> List[str]:
        bank_id = self._get_bank_id(project_id, client_id)
        return await self.recall(
            bank_id,
            "agreement deliverables scope changes decisions requests",
        )

    def get_bank_id_for_project(self, project_id: int, client_id: int) -> str:
        return self._get_bank_id(project_id, client_id)


hindsight_service = HindsightService()
