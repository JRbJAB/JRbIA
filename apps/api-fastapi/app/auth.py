from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from .config import Settings


class AuthenticationError(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class Identity:
    user_id: str
    email: str | None = None


class TokenVerifier(Protocol):
    async def verify(self, token: str) -> Identity: ...


class FirebaseTokenVerifier:
    """Server-side verifier. There is no frontend authorization fallback."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._initialized = False

    def _ensure_initialized(self) -> None:
        if self._initialized:
            return
        try:
            import firebase_admin
        except ImportError as exc:  # pragma: no cover - deployment dependency
            raise AuthenticationError("firebase-admin is not installed") from exc

        try:
            firebase_admin.get_app()
        except ValueError:
            options = {"projectId": self._settings.firebase_project_id} if self._settings.firebase_project_id else None
            firebase_admin.initialize_app(options=options)
        self._initialized = True

    async def verify(self, token: str) -> Identity:
        if not token:
            raise AuthenticationError("Missing bearer token")
        self._ensure_initialized()
        from firebase_admin import auth

        try:
            decoded = auth.verify_id_token(token, check_revoked=self._settings.firebase_check_revoked)
        except Exception as exc:  # Firebase exposes several provider exceptions
            raise AuthenticationError("Invalid Firebase ID token") from exc

        user_id = decoded.get("uid") or decoded.get("sub")
        if not user_id:
            raise AuthenticationError("Token has no user identifier")
        # Supabase Third-Party Auth expects the Firebase token to carry the
        # authenticated Postgres role. Fail closed before querying the Data API.
        if decoded.get("role") != "authenticated":
            raise AuthenticationError("Firebase token is missing role=authenticated for Supabase")
        return Identity(user_id=str(user_id), email=decoded.get("email"))


class StaticTokenVerifier:
    """Test-only verifier injected by the application factory."""

    def __init__(self, identities: dict[str, Identity]) -> None:
        self._identities = identities

    async def verify(self, token: str) -> Identity:
        try:
            return self._identities[token]
        except KeyError as exc:
            raise AuthenticationError("Unknown test token") from exc
