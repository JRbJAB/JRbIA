from __future__ import annotations

import hashlib
from typing import Any

import httpx

from .config import Settings
from .platform import Membership, OrganizationEntitlement, Role
from .signature_studio import SignatureRecord


class SupabaseConfigurationError(RuntimeError):
    pass


class SupabaseDataApi:
    """RLS-aware Supabase Data API client using the native Supabase JWT.

    The publishable key identifies the JRbIA project. Authorization remains the
    native caller JWT issued by Supabase Auth, so database RLS is
    evaluated for every request. No service/secret key is used here.
    """

    def __init__(self, settings: Settings) -> None:
        self._base_url = (
            f"{str(settings.supabase_url).rstrip('/')}/rest/v1"
            if settings.supabase_url
            else None
        )
        self._publishable_key = settings.supabase_publishable_key
        if settings.app_env in {"staging", "production"} and (
            not self._base_url or not self._publishable_key
        ):
            raise SupabaseConfigurationError(
                "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required for DATA_BACKEND=supabase"
            )
        self._schema = settings.supabase_schema
        self._timeout = settings.supabase_timeout_seconds

    async def request(
        self,
        method: str,
        path: str,
        *,
        access_token: str | None,
        params: dict[str, str] | None = None,
        json: Any | None = None,
        prefer: str | None = None,
    ) -> list[dict[str, Any]]:
        if not self._base_url or not self._publishable_key:
            raise SupabaseConfigurationError(
                "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are not configured"
            )
        if not access_token:
            raise SupabaseConfigurationError("A verified caller token is required for Supabase RLS")
        headers = {
            "apikey": self._publishable_key,
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
            "Accept-Profile": self._schema,
            "Content-Profile": self._schema,
        }
        if prefer:
            headers["Prefer"] = prefer
        async with httpx.AsyncClient(base_url=self._base_url, timeout=self._timeout) as client:
            response = await client.request(method, path, params=params, json=json, headers=headers)
        response.raise_for_status()
        if response.status_code == 204 or not response.content:
            return []
        payload = response.json()
        if isinstance(payload, list):
            return payload
        return [payload]


class SupabaseMembershipRepository:
    def __init__(self, api: SupabaseDataApi) -> None:
        self._api = api

    async def list_for_user(self, user_id: str, access_token: str | None = None) -> list[Membership]:
        rows = await self._api.request(
            "GET",
            "/organization_memberships",
            access_token=access_token,
            params={
                "select": "organization_id,organization_name,user_id,role,status",
                "user_id": f"eq.{user_id}",
                "status": "eq.active",
            },
        )
        return [
            Membership(
                organization_id=row["organization_id"],
                organization_name=row.get("organization_name") or row["organization_id"],
                user_id=row["user_id"],
                role=Role(row["role"]),
                status=row.get("status", "active"),
            )
            for row in rows
        ]


class SupabaseEntitlementRepository:
    def __init__(self, api: SupabaseDataApi) -> None:
        self._api = api

    @staticmethod
    def _model(row: dict[str, Any]) -> OrganizationEntitlement:
        return OrganizationEntitlement(
            organization_id=row["organization_id"],
            tool_id=row["tool_id"],
            plan_code=row["plan_code"],
            status=row.get("status", "active"),
            capabilities_add=set(row.get("capabilities_add") or []),
            capabilities_remove=set(row.get("capabilities_remove") or []),
            quota_overrides=row.get("quota_overrides") or {},
            starts_at=row.get("starts_at"),
            ends_at=row.get("ends_at"),
        )

    async def get(
        self, organization_id: str, tool_id: str, access_token: str | None = None
    ) -> OrganizationEntitlement | None:
        rows = await self._api.request(
            "GET",
            "/organization_entitlements",
            access_token=access_token,
            params={
                "select": "*",
                "organization_id": f"eq.{organization_id}",
                "tool_id": f"eq.{tool_id}",
                "limit": "1",
            },
        )
        return self._model(rows[0]) if rows else None

    async def list_for_organization(
        self, organization_id: str, access_token: str | None = None
    ) -> list[OrganizationEntitlement]:
        rows = await self._api.request(
            "GET",
            "/organization_entitlements",
            access_token=access_token,
            params={"select": "*", "organization_id": f"eq.{organization_id}"},
        )
        return [self._model(row) for row in rows]


class SupabaseSignatureRepository:
    def __init__(self, api: SupabaseDataApi) -> None:
        self._api = api

    @staticmethod
    def _record(row: dict[str, Any]) -> SignatureRecord:
        return SignatureRecord.model_validate(
            {
                "id": row["id"],
                "organizationId": row["organization_id"],
                "createdBy": row["created_by"],
                "status": row.get("status", "draft"),
                "request": row["request"],
                "renderHash": row["render_hash"],
                "createdAt": row["created_at"],
                "updatedAt": row["updated_at"],
            }
        )

    async def create(
        self,
        record: SignatureRecord,
        idempotency_key: str | None,
        access_token: str | None = None,
    ) -> SignatureRecord:
        digest = None
        if idempotency_key:
            digest = hashlib.sha256(
                f"{record.organizationId}:{idempotency_key}".encode("utf-8")
            ).hexdigest()
            rows = await self._api.request(
                "GET",
                "/signatures",
                access_token=access_token,
                params={
                    "select": "*",
                    "organization_id": f"eq.{record.organizationId}",
                    "idempotency_key_hash": f"eq.{digest}",
                    "limit": "1",
                },
            )
            if rows:
                return self._record(rows[0])

        payload = {
            "id": record.id,
            "organization_id": record.organizationId,
            "created_by": record.createdBy,
            "status": record.status,
            "request": record.request.model_dump(mode="json"),
            "render_hash": record.renderHash,
            "idempotency_key_hash": digest,
            "created_at": record.createdAt.isoformat(),
            "updated_at": record.updatedAt.isoformat(),
        }
        try:
            rows = await self._api.request(
                "POST",
                "/signatures",
                access_token=access_token,
                json=payload,
                prefer="return=representation",
            )
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code != 409 or not digest:
                raise
            rows = await self._api.request(
                "GET",
                "/signatures",
                access_token=access_token,
                params={
                    "select": "*",
                    "organization_id": f"eq.{record.organizationId}",
                    "idempotency_key_hash": f"eq.{digest}",
                    "limit": "1",
                },
            )
        if not rows:
            raise RuntimeError("Supabase did not return the created signature")
        return self._record(rows[0])

    async def list(
        self, organization_id: str, access_token: str | None = None
    ) -> list[SignatureRecord]:
        rows = await self._api.request(
            "GET",
            "/signatures",
            access_token=access_token,
            params={
                "select": "*",
                "organization_id": f"eq.{organization_id}",
                "order": "created_at.desc",
                "limit": "100",
            },
        )
        return [self._record(row) for row in rows]
