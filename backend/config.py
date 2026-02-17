from functools import lru_cache
from typing import List, Optional
import os

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "FlowGen AI – Intelligent Support Workflow Automation System"
    environment: str = os.getenv("ENVIRONMENT", "development")

    gemini_api_key: str
    gemini_model: str = "gemini-1.5-flash"

    database_url: str = "sqlite:///./flowgen.db"

    allowed_origins: List[AnyHttpUrl] = []

    rate_limit_requests_per_minute: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: Optional[str]):
        if v is None or v == "":
            return []
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


@lru_cache()
def get_settings() -> Settings:
    return Settings()

