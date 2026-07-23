from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: Literal["local", "test", "staging", "production"] = "local"
    api_prefix: str = "/api/v1"
    data_backend: Literal["supabase", "firestore"] = "supabase"

    # Authentication remains Firebase for the first commercial slice. Supabase
    # trusts Firebase JWTs through Third-Party Auth; the publishable key is not a secret.
    firebase_project_id: str | None = None
    firebase_check_revoked: bool = True

    # Supabase Data API. The backend forwards the verified caller JWT so RLS remains active.
    supabase_url: AnyHttpUrl | None = None
    supabase_publishable_key: str | None = None
    supabase_schema: str = "public"
    supabase_storage_bucket: str = "jrbia-brand-assets"
    supabase_timeout_seconds: float = 10.0

    # Legacy fallback kept behind the repository boundary during migration.
    google_cloud_project: str | None = None
    firestore_database: str = "(default)"

    allowed_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    signature_studio_default_enabled: bool = False
    asset_base_url: AnyHttpUrl = "https://assets.example.invalid/jrbia"


@lru_cache
def get_settings() -> Settings:
    return Settings()
