from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

import httpx

from .config import Settings


class AuthenticationError(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class Identity:
    user_id: str
    email: str | None = None


class TokenVerifier(Protocol):
    async def verify(self, token: str) -> Identity: ...


class SupabaseTokenVerifier:
    """Validate the caller's native Supabase access token with Auth."""

    def __init__(self, settings: Settings) -> None:
        self._base_url = str(settings.supabase_url).rstrip("/") if settings.supabase_url else None
        self._publishable_key = settings.supabase_publishable_key
        self._timeout = settings.supabase_timeout_seconds

    async def verify(self, token: str) -> Identity:
        if not token:
            raise AuthenticationError("Missing bearer token")
        if not self._base_url or not self._publishable_key:
            raise AuthenticationError("Supabase Auth is not configured")

        headers = {
            "apikey": self._publishable_key,
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        }
        try:
            async with httpx.AsyncClient(base_url=self._base_url, timeout=self._timeout) as client:
                response = await client.get("/auth/v1/user", headers=headers)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise AuthenticationError("Invalid or expired Supabase access token") from exc

        user = response.json()
        user_id = user.get("id")
        if not user_id:
            raise AuthenticationError("Supabase Auth response has no user identifier")
        return Identity(user_id=str(user_id), email=user.get("email"))


class StaticTokenVerifier:
    """Test-only verifier injected by the application factory."""

    def __init__(self, identities: dict[str, Identity]) -> None:
        self._identities = identities

    async def verify(self, token: str) -> Identity:
        try:
            return self._identities[token]
        except KeyError as exc:
            raise AuthenticationError("Unknown test token") from exc
