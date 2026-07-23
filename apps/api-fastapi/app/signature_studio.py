from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from html import escape
from typing import Protocol
from uuid import uuid4

import bleach
from bleach.css_sanitizer import CSSSanitizer
from pydantic import BaseModel, EmailStr, Field, HttpUrl

from .platform import EntitlementDecision, Principal, PRODUCT_INTEGRATION_ORDER

ENGINE_VERSION = "signature-renderer/1.2.0"
ALLOWED_TAGS = ["table", "tbody", "tr", "td", "div", "span", "a", "img", "br"]
ALLOWED_CSS_PROPERTIES = [
    "background-color",
    "border",
    "border-collapse",
    "border-right",
    "color",
    "display",
    "font-family",
    "font-size",
    "font-weight",
    "height",
    "line-height",
    "margin",
    "max-width",
    "padding",
    "text-decoration",
    "vertical-align",
    "width",
]
CSS_SANITIZER = CSSSanitizer(allowed_css_properties=ALLOWED_CSS_PROPERTIES)
ALLOWED_ATTRIBUTES = {
    "*": ["style"],
    "a": ["href", "title"],
    "img": ["src", "alt", "width", "height"],
    "table": ["role", "cellpadding", "cellspacing", "border"],
}


class BrandProfile(BaseModel):
    id: str
    slug: str
    displayName: str
    descriptor: str
    accentColor: str
    productId: str | None = None
    hostedLogoUrl: HttpUrl


class PersonInput(BaseModel):
    fullName: str = Field(min_length=1, max_length=160)
    jobTitle: str = Field(min_length=1, max_length=160)
    email: EmailStr
    phoneE164: str | None = Field(default=None, pattern=r"^\+[1-9][0-9]{6,14}$")
    websiteUrl: HttpUrl | None = None
    locale: str = "fr-FR"


class SignaturePreviewRequest(BaseModel):
    brandProfileId: str
    templateCode: str = "jrbia-standard-v1"
    person: PersonInput
    imageMode: str = "hosted"


class SignaturePreviewResponse(BaseModel):
    html: str
    text: str
    renderHash: str
    engineVersion: str
    warnings: list[str]


class SignatureRecord(BaseModel):
    id: str
    organizationId: str
    createdBy: str
    status: str = "draft"
    request: SignaturePreviewRequest
    renderHash: str
    createdAt: datetime
    updatedAt: datetime


class SignatureRepository(Protocol):
    async def create(
        self,
        record: SignatureRecord,
        idempotency_key: str | None,
        access_token: str | None = None,
    ) -> SignatureRecord: ...

    async def list(
        self, organization_id: str, access_token: str | None = None
    ) -> list[SignatureRecord]: ...


class InMemorySignatureRepository:
    def __init__(self) -> None:
        self._records: dict[tuple[str, str], SignatureRecord] = {}
        self._idempotency: dict[tuple[str, str], str] = {}

    async def create(
        self,
        record: SignatureRecord,
        idempotency_key: str | None,
        access_token: str | None = None,
    ) -> SignatureRecord:
        if idempotency_key:
            previous_id = self._idempotency.get((record.organizationId, idempotency_key))
            if previous_id:
                return self._records[(record.organizationId, previous_id)]
            self._idempotency[(record.organizationId, idempotency_key)] = record.id
        self._records[(record.organizationId, record.id)] = record
        return record

    async def list(
        self, organization_id: str, access_token: str | None = None
    ) -> list[SignatureRecord]:
        return [record for (org_id, _), record in self._records.items() if org_id == organization_id]


def seed_brand_profiles(asset_base_url: str) -> list[BrandProfile]:
    base = asset_base_url.rstrip("/")
    rows = [
        ("jrbia", "JRbIA", "L’IA utile aux métiers.", "#2563EB", None),
        ("eventpilot-ia", "EventPilot IA", "Intelligence événementielle", "#2563EB", "eventpilot-ia"),
        ("heberpilot-ia", "HéberPilot IA", "Intelligence hébergement", "#14B8A6", "heberpilot-ia"),
        ("locapilot-ia", "LocaPilot IA", "Intelligence locative", "#F97316", "locapilot-ia"),
        ("qaic", "QAIC", "Qualité & Conformité IA", "#7C3AED", "qaic"),
        ("qait", "QAIT", "Tests & Évaluation IA", "#0EA5E9", "qait"),
    ]
    return [
        BrandProfile(
            id=slug,
            slug=slug,
            displayName=name,
            descriptor=descriptor,
            accentColor=accent,
            productId=product,
            hostedLogoUrl=f"{base}/{slug}/signature-logo.png",
        )
        for slug, name, descriptor, accent, product in rows
    ]


class SignatureRenderer:
    def __init__(self, brand_profiles: list[BrandProfile]) -> None:
        self._brands = {brand.id: brand for brand in brand_profiles}

    def render(self, request: SignaturePreviewRequest) -> SignaturePreviewResponse:
        if request.imageMode != "hosted":
            raise ValueError("The web MVP defaults to hosted HTTPS images; data_uri remains offline-only")
        brand = self._brands.get(request.brandProfileId)
        if not brand:
            raise ValueError("Unknown brand profile")
        person = request.person
        phone_line = f'<a href="tel:{escape(person.phoneE164)}" style="color:#0F1B2E;text-decoration:none;">{escape(person.phoneE164)}</a>' if person.phoneE164 else ""
        website_line = f'<a href="{escape(str(person.websiteUrl))}" style="color:{brand.accentColor};text-decoration:none;">{escape(str(person.websiteUrl))}</a>' if person.websiteUrl else ""
        html = f"""<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;color:#0F1B2E;max-width:620px;">
<tr><td style="vertical-align:top;padding:0 18px 0 0;border-right:3px solid {brand.accentColor};width:190px;"><img src="{brand.hostedLogoUrl}" alt="{escape(brand.displayName)}" width="170" style="display:block;width:170px;height:auto;border:0;"></td>
<td style="vertical-align:top;padding:0 0 0 18px;"><div style="font-size:18px;font-weight:700;line-height:1.35;">{escape(person.fullName)}</div><div style="font-size:14px;color:#6B7280;line-height:1.5;">{escape(person.jobTitle)}</div><br><a href="mailto:{escape(str(person.email))}" style="color:#0F1B2E;text-decoration:none;">{escape(str(person.email))}</a><br>{phone_line}<br>{website_line}<br><span style="font-size:12px;color:{brand.accentColor};font-weight:700;">{escape(brand.displayName)} — {escape(brand.descriptor)}</span></td></tr></table>"""
        clean_options: dict[str, object] = {
            "tags": ALLOWED_TAGS,
            "attributes": ALLOWED_ATTRIBUTES,
            "protocols": ["https", "mailto", "tel"],
            "strip": True,
        }
        clean_options["css_sanitizer"] = CSS_SANITIZER
        sanitized = bleach.clean(html, **clean_options)
        canonical = json.dumps(
            {"engine": ENGINE_VERSION, "request": request.model_dump(mode="json"), "brand": brand.model_dump(mode="json")},
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        )
        render_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        text_lines = [person.fullName, person.jobTitle, str(person.email)]
        if person.phoneE164:
            text_lines.append(person.phoneE164)
        if person.websiteUrl:
            text_lines.append(str(person.websiteUrl))
        text_lines.append(f"{brand.displayName} — {brand.descriptor}")
        return SignaturePreviewResponse(
            html=sanitized,
            text="\n".join(text_lines),
            renderHash=render_hash,
            engineVersion=ENGINE_VERSION,
            warnings=["Images distantes : le client e-mail peut demander une autorisation d’affichage."],
        )


class SignatureService:
    def __init__(self, repository: SignatureRepository, renderer: SignatureRenderer, brand_profiles: list[BrandProfile]) -> None:
        self._repository = repository
        self._renderer = renderer
        self._brand_profiles = brand_profiles

    def bootstrap(self, decision: EntitlementDecision) -> dict[str, object]:
        return {
            "toolId": "signature-studio",
            "planCode": decision.plan_code,
            "capabilities": sorted(decision.capabilities),
            "quotas": decision.quotas,
            "brandProfiles": [profile.model_dump(mode="json") for profile in self._brand_profiles],
            "imageModeDefault": "hosted",
            "approvalPolicy": "editor_manager",
            "integrationOrder": PRODUCT_INTEGRATION_ORDER,
        }

    def preview(self, request: SignaturePreviewRequest) -> SignaturePreviewResponse:
        return self._renderer.render(request)

    async def create(self, principal: Principal, organization_id: str, request: SignaturePreviewRequest, idempotency_key: str | None) -> SignatureRecord:
        rendered = self._renderer.render(request)
        now = datetime.now(timezone.utc)
        record = SignatureRecord(
            id=str(uuid4()),
            organizationId=organization_id,
            createdBy=principal.user_id,
            request=request,
            renderHash=rendered.renderHash,
            createdAt=now,
            updatedAt=now,
        )
        return await self._repository.create(record, idempotency_key, principal.access_token)

    async def list(
        self, organization_id: str, access_token: str | None = None
    ) -> list[SignatureRecord]:
        return await self._repository.list(organization_id, access_token)
