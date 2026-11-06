from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    hindsight_api_key: str = os.getenv("HINDSIGHT_API_KEY", "")
    hindsight_base_url: str = os.getenv(
        "HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io"
    )
    database_url: str = os.getenv(
        "DATABASE_URL", "sqlite+aiosqlite:///./scopesentry.db"
    )
    app_name: str = "ScopeSentry AI"
    debug: bool = True

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
