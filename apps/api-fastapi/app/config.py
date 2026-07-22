from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: Literal["local", "test", "staging", "production"] = "local"
    api_prefix: str = "/api/v1"
    google_cloud_project: str | None = None
    firebase_project_id: str | None = None
    firestore_database: str = "(default)"
    allowed_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    signature_studio_default_enabled: bool = False
    asset_base_url: AnyHttpUrl = "https://assets.example.invalid/jrbia"
    firebase_check_revoked: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
