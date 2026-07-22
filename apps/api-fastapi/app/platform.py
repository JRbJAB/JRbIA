from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import StrEnum
from typing import Protocol

from pydantic import BaseModel, Field


class Role(StrEnum):
    OWNER = "owner"
    ADMIN = "admin"
    MANAGER = "manager"
    EDITOR = "editor"
    VIEWER = "viewer"


class Membership(BaseModel):
    organization_id: str
    organization_name: str
    user_id: str
    role: Role
    status: str = "active"


class OrganizationMembershipResponse(BaseModel):
    organizationId: str
    organizationName: str
    role: Role


class Principal(BaseModel):
    user_id: str
    email: str | None = None
    memberships: dict[str, Membership]


class CatalogTool(BaseModel):
    toolId: str
    displayName: str
    description: str
    route: str
    status: str
    version: str
    capabilities: list[str] = Field(default_factory=list)
    productId: str | None = None


class OrganizationEntitlement(BaseModel):
    organization_id: str
    tool_id: str
    plan_code: str
    status: str = "active"
    capabilities_add: set[str] = Field(default_factory=set)
    capabilities_remove: set[str] = Field(default_factory=set)
    quota_overrides: dict[str, int] = Field(default_factory=dict)
    starts_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ends_at: datetime | None = None


class PlanDefinition(BaseModel):
    code: str
    display_name: str
    capabilities: set[str]
    quotas: dict[str, int]


CAPABILITIES = {
    "read": "signature.read",
    "create": "signature.create",
    "update": "signature.update",
    "approve": "signature.approve",
    "export_html": "signature.export.html",
    "export_text": "signature.export.text",
    "bulk": "signature.bulk",
    "template_manage": "signature.template.manage",
    "brand_manage": "signature.brand.manage",
    "audit_read": "signature.audit.read",
}

PLAN_DEFINITIONS: dict[str, PlanDefinition] = {
    "starter": PlanDefinition(
        code="starter",
        display_name="Starter",
        capabilities={
            CAPABILITIES["read"], CAPABILITIES["create"], CAPABILITIES["update"],
            CAPABILITIES["export_html"], CAPABILITIES["export_text"],
        },
        quotas={"active_signatures": 25, "exports_per_month": 100, "bulk_rows_per_job": 0, "brand_profiles": 1},
    ),
    "pro": PlanDefinition(
        code="pro",
        display_name="Pro",
        capabilities={
            CAPABILITIES["read"], CAPABILITIES["create"], CAPABILITIES["update"],
            CAPABILITIES["approve"], CAPABILITIES["export_html"], CAPABILITIES["export_text"],
            CAPABILITIES["bulk"], CAPABILITIES["audit_read"],
        },
        quotas={"active_signatures": 250, "exports_per_month": 5000, "bulk_rows_per_job": 500, "brand_profiles": 6},
    ),
    "organization": PlanDefinition(
        code="organization",
        display_name="Organisation",
        capabilities=set(CAPABILITIES.values()),
        quotas={"active_signatures": 5000, "exports_per_month": 50000, "bulk_rows_per_job": 5000, "brand_profiles": 100},
    ),
}

PRODUCT_INTEGRATION_ORDER = ["eventpilot-ia", "heberpilot-ia", "locapilot-ia", "qaic", "qait"]

TOOL_CATALOG: list[CatalogTool] = [
    CatalogTool(
        toolId="signature-studio",
        displayName="JRbIA Signature Studio",
        description="Créer, valider, versionner et exporter des signatures e-mail de marque.",
        route="/tools/signature-studio",
        status="draft",
        version="1.2.0",
    ),
    CatalogTool(toolId="eventpilot-ia", displayName="EventPilot IA", description="Intelligence événementielle", route="/tools/eventpilot-ia", status="draft", version="0.1.0", productId="eventpilot-ia"),
    CatalogTool(toolId="heberpilot-ia", displayName="HéberPilot IA", description="Intelligence hébergement", route="/tools/heberpilot-ia", status="draft", version="0.1.0", productId="heberpilot-ia"),
    CatalogTool(toolId="locapilot-ia", displayName="LocaPilot IA", description="Intelligence locative", route="/tools/locapilot-ia", status="draft", version="0.1.0", productId="locapilot-ia"),
    CatalogTool(toolId="qaic", displayName="QAIC", description="Qualité & Conformité IA", route="/tools/qaic", status="draft", version="0.1.0", productId="qaic"),
    CatalogTool(toolId="qait", displayName="QAIT", description="Tests & Évaluation IA", route="/tools/qait", status="draft", version="0.1.0", productId="qait"),
]


class MembershipRepository(Protocol):
    async def list_for_user(self, user_id: str) -> list[Membership]: ...


class EntitlementRepository(Protocol):
    async def get(self, organization_id: str, tool_id: str) -> OrganizationEntitlement | None: ...

    async def list_for_organization(self, organization_id: str) -> list[OrganizationEntitlement]: ...


class AuthorizationDenied(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class EntitlementDecision:
    tool_id: str
    plan_code: str
    capabilities: frozenset[str]
    quotas: dict[str, int]


class PlatformService:
    def __init__(self, memberships: MembershipRepository, entitlements: EntitlementRepository) -> None:
        self._memberships = memberships
        self._entitlements = entitlements

    async def principal(self, user_id: str, email: str | None = None) -> Principal:
        memberships = [m for m in await self._memberships.list_for_user(user_id) if m.status == "active"]
        return Principal(user_id=user_id, email=email, memberships={m.organization_id: m for m in memberships})

    def assert_membership(self, principal: Principal, organization_id: str) -> Membership:
        membership = principal.memberships.get(organization_id)
        if not membership:
            raise AuthorizationDenied("Organization membership required")
        return membership

    async def resolve_entitlement(self, organization_id: str, tool_id: str) -> EntitlementDecision:
        entitlement = await self._entitlements.get(organization_id, tool_id)
        if not entitlement or entitlement.status not in {"trial", "active"}:
            raise AuthorizationDenied("Tool entitlement required")
        plan = PLAN_DEFINITIONS.get(entitlement.plan_code)
        if not plan:
            raise AuthorizationDenied("Unknown commercial plan")
        capabilities = (plan.capabilities | entitlement.capabilities_add) - entitlement.capabilities_remove
        quotas = {**plan.quotas, **entitlement.quota_overrides}
        return EntitlementDecision(tool_id=tool_id, plan_code=plan.code, capabilities=frozenset(capabilities), quotas=quotas)

    async def require_capability(self, principal: Principal, organization_id: str, tool_id: str, capability: str) -> EntitlementDecision:
        self.assert_membership(principal, organization_id)
        decision = await self.resolve_entitlement(organization_id, tool_id)
        if capability not in decision.capabilities:
            raise AuthorizationDenied(f"Capability required: {capability}")
        return decision

    async def list_catalog(self, principal: Principal, organization_id: str) -> list[CatalogTool]:
        self.assert_membership(principal, organization_id)
        entitlements = {item.tool_id: item for item in await self._entitlements.list_for_organization(organization_id) if item.status in {"trial", "active"}}
        result: list[CatalogTool] = []
        for tool in TOOL_CATALOG:
            entitlement = entitlements.get(tool.toolId)
            if not entitlement:
                continue
            plan = PLAN_DEFINITIONS.get(entitlement.plan_code)
            capabilities = sorted(((plan.capabilities if plan else set()) | entitlement.capabilities_add) - entitlement.capabilities_remove)
            result.append(tool.model_copy(update={"capabilities": capabilities, "status": "active"}))
        return result


class InMemoryMembershipRepository:
    def __init__(self, memberships: list[Membership]) -> None:
        self._memberships = memberships

    async def list_for_user(self, user_id: str) -> list[Membership]:
        return [membership for membership in self._memberships if membership.user_id == user_id]


class InMemoryEntitlementRepository:
    def __init__(self, entitlements: list[OrganizationEntitlement]) -> None:
        self._entitlements = entitlements

    async def get(self, organization_id: str, tool_id: str) -> OrganizationEntitlement | None:
        return next((e for e in self._entitlements if e.organization_id == organization_id and e.tool_id == tool_id), None)

    async def list_for_organization(self, organization_id: str) -> list[OrganizationEntitlement]:
        return [e for e in self._entitlements if e.organization_id == organization_id]
