from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

from .auth import AuthenticationError, TokenVerifier
from .platform import (
    AuthorizationDenied,
    CAPABILITIES,
    OrganizationMembershipResponse,
    PlatformService,
    Principal,
)
from .signature_studio import SignaturePreviewRequest, SignaturePreviewResponse, SignatureRecord, SignatureService


@dataclass(slots=True)
class Services:
    token_verifier: TokenVerifier
    platform: PlatformService
    signatures: SignatureService


def get_services(request: Request) -> Services:
    return request.app.state.services


async def get_principal(
    services: Annotated[Services, Depends(get_services)],
    authorization: Annotated[str | None, Header()] = None,
) -> Principal:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token required")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        identity = await services.token_verifier.verify(token)
        return await services.platform.principal(identity.user_id, identity.email, token)
    except AuthenticationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


def build_api_router() -> APIRouter:
    router = APIRouter()

    @router.get("/me/organizations", response_model=list[OrganizationMembershipResponse])
    async def list_my_organizations(principal: Annotated[Principal, Depends(get_principal)]):
        return [
            OrganizationMembershipResponse(
                organizationId=membership.organization_id,
                organizationName=membership.organization_name,
                role=membership.role,
            )
            for membership in principal.memberships.values()
        ]

    @router.get("/organizations/{organization_id}/catalog/tools")
    async def list_tools(
        organization_id: str,
        principal: Annotated[Principal, Depends(get_principal)],
        services: Annotated[Services, Depends(get_services)],
    ):
        try:
            return await services.platform.list_catalog(principal, organization_id)
        except AuthorizationDenied as exc:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied") from exc

    @router.get("/organizations/{organization_id}/signature-studio/bootstrap")
    async def signature_studio_bootstrap(
        organization_id: str,
        principal: Annotated[Principal, Depends(get_principal)],
        services: Annotated[Services, Depends(get_services)],
    ):
        try:
            decision = await services.platform.require_capability(
                principal, organization_id, "signature-studio", CAPABILITIES["read"]
            )
            return services.signatures.bootstrap(decision)
        except AuthorizationDenied as exc:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied") from exc

    @router.post(
        "/organizations/{organization_id}/signature-studio/preview",
        response_model=SignaturePreviewResponse,
    )
    async def preview_signature(
        organization_id: str,
        payload: SignaturePreviewRequest,
        principal: Annotated[Principal, Depends(get_principal)],
        services: Annotated[Services, Depends(get_services)],
    ):
        try:
            await services.platform.require_capability(
                principal, organization_id, "signature-studio", CAPABILITIES["create"]
            )
            return services.signatures.preview(payload)
        except AuthorizationDenied as exc:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied") from exc
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    @router.get(
        "/organizations/{organization_id}/signature-studio/signatures",
        response_model=list[SignatureRecord],
    )
    async def list_signatures(
        organization_id: str,
        principal: Annotated[Principal, Depends(get_principal)],
        services: Annotated[Services, Depends(get_services)],
    ):
        try:
            await services.platform.require_capability(
                principal, organization_id, "signature-studio", CAPABILITIES["read"]
            )
            return await services.signatures.list(organization_id, principal.access_token)
        except AuthorizationDenied as exc:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied") from exc

    @router.post(
        "/organizations/{organization_id}/signature-studio/signatures",
        response_model=SignatureRecord,
        status_code=status.HTTP_201_CREATED,
    )
    async def create_signature(
        organization_id: str,
        payload: SignaturePreviewRequest,
        principal: Annotated[Principal, Depends(get_principal)],
        services: Annotated[Services, Depends(get_services)],
        idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
    ):
        try:
            await services.platform.require_capability(
                principal, organization_id, "signature-studio", CAPABILITIES["create"]
            )
            return await services.signatures.create(principal, organization_id, payload, idempotency_key)
        except AuthorizationDenied as exc:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied") from exc
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    return router
