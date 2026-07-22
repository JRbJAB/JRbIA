/** Shared contracts for JRbIA Signature Studio. No runtime implementation. */

export type ToolStatus = "draft" | "active" | "retired";
export type EntitlementStatus = "trial" | "active" | "suspended" | "expired";
export type SignatureStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "rejected"
  | "published"
  | "archived";
export type ImageMode = "hosted" | "data_uri";

export interface ToolCatalogEntry {
  toolId: string;
  displayName: string;
  description?: string;
  route: `/admin/tools/${string}`;
  status: ToolStatus;
  version: string;
  capabilities: string[];
  commercial: {
    sellable: boolean;
    bundleEligible: boolean;
    defaultPlanCode?: string | null;
    meteredCapabilities?: string[];
  };
  integration?: {
    deepLinkParams?: string[];
    sourceProducts?: string[];
    returnToAllowedPrefixes?: string[];
  };
}

export interface OrganizationEntitlement {
  organizationId: string;
  toolId: string;
  planCode: string;
  status: EntitlementStatus;
  capabilities: string[];
  quotas: Record<string, number>;
  startsAt: string;
  endsAt?: string | null;
}

export interface BrandProfile {
  id: string;
  organizationId: string;
  productId?: string | null;
  slug: string;
  displayName: string;
  descriptor: string;
  accentColor: `#${string}`;
  logoAssetId: string;
  inverseLogoAssetId?: string | null;
  version: number;
  status: "draft" | "active" | "archived";
}

export interface PersonProfileInput {
  fullName: string;
  jobTitle: string;
  email: string;
  phoneE164?: string | null;
  websiteUrl?: string | null;
  locale: string;
  socialLinks?: Array<{ kind: string; url: string }>;
}

export interface SignatureRenderRequest {
  brandProfileId: string;
  templateCode: string;
  person: PersonProfileInput;
  imageMode: ImageMode;
  productContext?: {
    productId: string;
    returnTo?: string;
  } | null;
}

export interface SignatureRenderResponse {
  html: string;
  text: string;
  renderHash: string;
  engineVersion: string;
  warnings: string[];
  compatibility: Record<string, unknown>;
}

export interface SignatureSummary {
  id: string;
  organizationId: string;
  personProfileId: string;
  brandProfileId: string;
  templateCode: string;
  status: SignatureStatus;
  currentVersionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const SIGNATURE_STUDIO_CATALOG_ENTRY: ToolCatalogEntry = {
  toolId: "signature-studio",
  displayName: "JRbIA Signature Studio",
  description: "Créer, valider, versionner et exporter des signatures e-mail de marque.",
  route: "/admin/tools/signature-studio",
  status: "draft",
  version: "1.2.0",
  capabilities: [
    "signature.read",
    "signature.create",
    "signature.update",
    "signature.approve",
    "signature.export.html",
    "signature.export.text",
    "signature.bulk",
    "signature.template.manage",
    "signature.brand.manage",
    "signature.audit.read",
  ],
  commercial: {
    sellable: true,
    bundleEligible: true,
    defaultPlanCode: null,
    meteredCapabilities: ["signature.bulk"],
  },
  integration: {
    deepLinkParams: ["product", "brand_profile", "person_profile", "return_to"],
    sourceProducts: ["eventpilot-ia", "heberpilot-ia", "locapilot-ia", "qaic", "qait"],
    returnToAllowedPrefixes: ["/admin/tools/"],
  },
};
