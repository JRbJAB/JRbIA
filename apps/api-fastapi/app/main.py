from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api import Services, build_api_router
from .auth import SupabaseTokenVerifier
from .config import Settings, get_settings
from .firestore import (
    FirestoreEntitlementRepository,
    FirestoreMembershipRepository,
    FirestoreProvider,
    FirestoreSignatureRepository,
)
from .platform import PlatformService
from .supabase import (
    SupabaseDataApi,
    SupabaseEntitlementRepository,
    SupabaseMembershipRepository,
    SupabaseSignatureRepository,
)
from .signature_studio import SignatureRenderer, SignatureService, seed_brand_profiles


def create_app(settings: Settings | None = None, services: Services | None = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(
        title="JRbIA Web Admin Client API",
        version="0.1.0",
        docs_url="/docs" if settings.app_env != "production" else None,
        redoc_url=None,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH"],
        allow_headers=["Authorization", "Content-Type", "Idempotency-Key", "X-Request-ID"],
    )

    if services is None:
        if settings.data_backend == "supabase":
            supabase = SupabaseDataApi(settings)
            memberships = SupabaseMembershipRepository(supabase)
            entitlements = SupabaseEntitlementRepository(supabase)
            signatures_repository = SupabaseSignatureRepository(supabase)
        else:
            firestore = FirestoreProvider(settings)
            memberships = FirestoreMembershipRepository(firestore)
            entitlements = FirestoreEntitlementRepository(firestore)
            signatures_repository = FirestoreSignatureRepository(firestore)
        platform = PlatformService(memberships, entitlements)
        brands = seed_brand_profiles(str(settings.asset_base_url))
        signatures = SignatureService(signatures_repository, SignatureRenderer(brands), brands)
        services = Services(
            token_verifier=SupabaseTokenVerifier(settings),
            platform=platform,
            signatures=signatures,
        )
    app.state.services = services

    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or "unassigned"
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    @app.exception_handler(Exception)
    async def unhandled_error(_: Request, __: Exception):
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    @app.get("/healthz", include_in_schema=False)
    async def healthz():
        return {"status": "ok", "runtime": "not-deployed", "module": "web-admin-client"}

    app.include_router(build_api_router(), prefix=settings.api_prefix)
    return app


app = create_app()
