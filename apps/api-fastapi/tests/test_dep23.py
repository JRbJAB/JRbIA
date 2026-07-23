import pytest

from app.auth import Identity, StaticTokenVerifier
from app.api import Services
from app.config import Settings
from app.main import create_app
from app.platform import (
    AuthorizationDenied,
    CAPABILITIES,
    InMemoryEntitlementRepository,
    InMemoryMembershipRepository,
    Membership,
    OrganizationEntitlement,
    PlatformService,
    Role,
)
from app.signature_studio import (
    InMemorySignatureRepository,
    PersonInput,
    SignaturePreviewRequest,
    SignatureRenderer,
    SignatureService,
    seed_brand_profiles,
)


@pytest.fixture
def services():
    memberships = InMemoryMembershipRepository([
        Membership(organization_id="org-a", organization_name="Organisation A", user_id="user-a", role=Role.OWNER),
        Membership(organization_id="org-b", organization_name="Organisation B", user_id="user-b", role=Role.OWNER),
    ])
    entitlements = InMemoryEntitlementRepository([
        OrganizationEntitlement(organization_id="org-a", tool_id="signature-studio", plan_code="pro"),
        OrganizationEntitlement(organization_id="org-b", tool_id="signature-studio", plan_code="starter"),
    ])
    platform = PlatformService(memberships, entitlements)
    brands = seed_brand_profiles("https://assets.example.invalid/jrbia")
    signatures = SignatureService(InMemorySignatureRepository(), SignatureRenderer(brands), brands)
    return Services(
        token_verifier=StaticTokenVerifier({"token-a": Identity("user-a", "a@example.com"), "token-b": Identity("user-b", "b@example.com")}),
        platform=platform,
        signatures=signatures,
    )


@pytest.mark.asyncio
async def test_tenant_access_is_denied_cross_organization(services):
    principal = await services.platform.principal("user-a")
    with pytest.raises(AuthorizationDenied):
        services.platform.assert_membership(principal, "org-b")


@pytest.mark.asyncio
async def test_plans_and_overrides_are_resolved(services):
    principal = await services.platform.principal("user-a")
    decision = await services.platform.require_capability(
        principal, "org-a", "signature-studio", CAPABILITIES["bulk"]
    )
    assert decision.plan_code == "pro"
    assert decision.quotas["bulk_rows_per_job"] == 500


@pytest.mark.asyncio
async def test_catalog_is_entitlement_filtered(services):
    principal = await services.platform.principal("user-a")
    catalog = await services.platform.list_catalog(principal, "org-a")
    assert [tool.toolId for tool in catalog] == ["signature-studio"]
    assert catalog[0].status == "active"


def test_renderer_is_deterministic_and_script_free():
    brands = seed_brand_profiles("https://assets.example.invalid/jrbia")
    renderer = SignatureRenderer(brands)
    request = SignaturePreviewRequest(
        brandProfileId="jrbia",
        person=PersonInput(
            fullName="Julien Riotte-Bronoël",
            jobTitle="Direction JRbIA",
            email="julie@riotte.work",
            phoneE164="+33745155228",
            websiteUrl="https://example.test",
        ),
    )
    first = renderer.render(request)
    second = renderer.render(request)
    assert first.renderHash == second.renderHash
    assert "<script" not in first.html.lower()
    assert "data:" not in first.html.lower()
    assert "https://assets.example.invalid" in first.html
    assert "font-family:" in first.html
    assert "Arial" in first.html
    assert "border-right:" in first.html
    assert "3px solid #2563EB" in first.html


@pytest.mark.asyncio
async def test_idempotent_create_and_tenant_list(services):
    principal = await services.platform.principal("user-a")
    request = SignaturePreviewRequest(
        brandProfileId="eventpilot-ia",
        person=PersonInput(fullName="Alice", jobTitle="Coordination", email="alice@example.com"),
    )
    first = await services.signatures.create(principal, "org-a", request, "idem-1")
    second = await services.signatures.create(principal, "org-a", request, "idem-1")
    assert first.id == second.id
    assert len(await services.signatures.list("org-a")) == 1
    assert await services.signatures.list("org-b") == []


def test_http_auth_and_catalog(services):
    from fastapi.testclient import TestClient

    app = create_app(Settings(app_env="test"), services)
    client = TestClient(app)
    assert client.get("/api/v1/me/organizations").status_code == 401
    response = client.get("/api/v1/organizations/org-a/catalog/tools", headers={"Authorization": "Bearer token-a"})
    assert response.status_code == 200
    assert response.json()[0]["toolId"] == "signature-studio"
    cross_tenant = client.get("/api/v1/organizations/org-b/catalog/tools", headers={"Authorization": "Bearer token-a"})
    assert cross_tenant.status_code == 403


def test_supabase_is_the_default_backend():
    settings = Settings(app_env="test")
    assert settings.data_backend == "supabase"
    assert settings.supabase_storage_bucket == "jrbia-brand-assets"


@pytest.mark.asyncio
async def test_principal_keeps_token_out_of_serialized_payload(services):
    principal = await services.platform.principal("user-a", access_token="firebase-jwt")
    assert principal.access_token == "firebase-jwt"
    assert "access_token" not in principal.model_dump()


def test_supabase_migrations_are_rls_first_and_storage_private():
    from pathlib import Path

    root = Path(__file__).resolve().parents[3]
    core = (root / "supabase/migrations/20260723000100_jrbia_platform_core.sql").read_text()
    storage = (root / "supabase/migrations/20260723000200_jrbia_storage.sql").read_text()

    for table in (
        "organizations",
        "organization_memberships",
        "organization_entitlements",
        "signatures",
    ):
        assert f"alter table public.{table} enable row level security" in core
        assert f"revoke all on public.{table} from anon" in core
    assert "created_by = public.jwt_subject()" in core
    assert "'jrbia-brand-assets'" in storage
    assert "false," in storage
    assert "storage.foldername(name)" in storage
    assert "m.role in ('owner','admin')" in storage
