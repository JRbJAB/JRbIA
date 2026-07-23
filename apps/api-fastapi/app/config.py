from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: Literal["local", "test", "staging", "production"] = "local"
    api_prefix: str = "/api/v1"
    data_backend: Literal["supabase", "firestore"] = "supabase"

    # Supabase Auth and Data API share the project URL and publishable key.
    # The backend forwards the native caller JWT so RLS remains active.
    supabase_url: AnyHttpUrl | None = None
    supabase_publishable_key: str | None = None
    supabase_schema: str = "public"
    supabase_storage_bucket: str = "jrbia-brand-assets"
    supabase_timeout_seconds: float = 10.0

    # Legacy persistence rollback only; Firebase Auth is not part of the target architecture.
    google_cloud_project: str | None = None
    firestore_database: str = "(default)"

    allowed_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    signature_studio_default_enabled: bool = False
    asset_base_url: AnyHttpUrl = "https://assets.example.invalid/jrbia"


@lru_cache
def get_settings() -> Settings:
    return Settings()
