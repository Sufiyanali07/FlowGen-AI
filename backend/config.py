from functools import lru_cache
from typing import List
import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "FlowGen AI – Intelligent Support Workflow Automation System"
    environment: str = os.getenv("ENVIRONMENT", "development")

    gemini_api_key: str
    gemini_model: str = "gemini-1.5-flash"

    database_url: str = "sqlite:///./flowgen.db"

    # Store as string so env var is not parsed as JSON (Render/Vercel set comma-separated URLs)
    allowed_origins: str = ""

    rate_limit_requests_per_minute: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    def get_allowed_origins_list(self) -> List[str]:
        """Parse ALLOWED_ORIGINS (comma-separated) into a list for CORS."""
        if not self.allowed_origins or not self.allowed_origins.strip():
            return []
        return [x.strip() for x in self.allowed_origins.split(",") if x.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()

