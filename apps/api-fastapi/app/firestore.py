from __future__ import annotations

import hashlib
from typing import Any

from .config import Settings
from .platform import Membership, OrganizationEntitlement, Role
from .signature_studio import SignatureRecord


class FirestoreProvider:
    """Lazy Firestore client. Import and network activity occur only at request time."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client: Any | None = None

    def client(self):
        if self._client is None:
            from google.cloud.firestore_v1.async_client import AsyncClient

            kwargs: dict[str, Any] = {}
            if self._settings.google_cloud_project:
                kwargs["project"] = self._settings.google_cloud_project
            if self._settings.firestore_database != "(default)":
                kwargs["database"] = self._settings.firestore_database
            self._client = AsyncClient(**kwargs)
        return self._client


class FirestoreMembershipRepository:
    def __init__(self, provider: FirestoreProvider) -> None:
        self._provider = provider

    async def list_for_user(self, user_id: str, access_token: str | None = None) -> list[Membership]:
        query = (
            self._provider.client().collection("organization_memberships")
            .where("user_id", "==", user_id)
            .where("status", "==", "active")
        )
        memberships: list[Membership] = []
        async for snapshot in query.stream():
            data = snapshot.to_dict()
            memberships.append(
                Membership(
                    organization_id=data["organization_id"],
                    organization_name=data.get("organization_name", data["organization_id"]),
                    user_id=user_id,
                    role=Role(data["role"]),
                    status=data.get("status", "active"),
                )
            )
        return memberships


class FirestoreEntitlementRepository:
    def __init__(self, provider: FirestoreProvider) -> None:
        self._provider = provider

    async def get(
        self, organization_id: str, tool_id: str, access_token: str | None = None
    ) -> OrganizationEntitlement | None:
        snapshot = await self._provider.client().collection("organization_entitlements").document(f"{organization_id}__{tool_id}").get()
        if not snapshot.exists:
            return None
        return OrganizationEntitlement.model_validate(snapshot.to_dict())

    async def list_for_organization(
        self, organization_id: str, access_token: str | None = None
    ) -> list[OrganizationEntitlement]:
        query = self._provider.client().collection("organization_entitlements").where("organization_id", "==", organization_id)
        result: list[OrganizationEntitlement] = []
        async for snapshot in query.stream():
            result.append(OrganizationEntitlement.model_validate(snapshot.to_dict()))
        return result


class FirestoreSignatureRepository:
    def __init__(self, provider: FirestoreProvider) -> None:
        self._provider = provider

    def _collection(self, organization_id: str):
        return self._provider.client().collection("organizations").document(organization_id).collection("signatures")

    async def create(
        self,
        record: SignatureRecord,
        idempotency_key: str | None,
        access_token: str | None = None,
    ) -> SignatureRecord:
        if idempotency_key:
            key_digest = hashlib.sha256(f"{record.organizationId}:{idempotency_key}".encode("utf-8")).hexdigest()
            key_ref = self._provider.client().collection("idempotency_keys").document(key_digest)
            key_snapshot = await key_ref.get()
            if key_snapshot.exists:
                signature_id = key_snapshot.to_dict()["signature_id"]
                existing = await self._collection(record.organizationId).document(signature_id).get()
                if existing.exists:
                    return SignatureRecord.model_validate(existing.to_dict())
        await self._collection(record.organizationId).document(record.id).set(record.model_dump(mode="json"))
        if idempotency_key:
            await key_ref.set({"organization_id": record.organizationId, "signature_id": record.id})
        return record

    async def list(
        self, organization_id: str, access_token: str | None = None
    ) -> list[SignatureRecord]:
        result: list[SignatureRecord] = []
        async for snapshot in self._collection(organization_id).order_by("createdAt", direction="DESCENDING").limit(100).stream():
            result.append(SignatureRecord.model_validate(snapshot.to_dict()))
        return result
