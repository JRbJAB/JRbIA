export const PRODUCT_INTEGRATION_ORDER = [
  "eventpilot-ia",
  "heberpilot-ia",
  "locapilot-ia",
  "qaic",
  "qait",
] as const;

export type ProductId = (typeof PRODUCT_INTEGRATION_ORDER)[number];
export type PlanCode = "starter" | "pro" | "organization";
export type OrganizationRole = "owner" | "admin" | "manager" | "editor" | "viewer";

export const SIGNATURE_CAPABILITIES = {
  read: "signature.read",
  create: "signature.create",
  update: "signature.update",
  approve: "signature.approve",
  exportHtml: "signature.export.html",
  exportText: "signature.export.text",
  bulk: "signature.bulk",
  manageTemplates: "signature.template.manage",
  manageBrands: "signature.brand.manage",
  readAudit: "signature.audit.read",
} as const;

export interface OrganizationMembership {
  organizationId: string;
  organizationName: string;
  role: OrganizationRole;
}

export interface CatalogTool {
  toolId: string;
  displayName: string;
  description: string;
  route: string;
  status: "draft" | "active" | "retired";
  version: string;
  capabilities: string[];
  productId?: ProductId;
}

export const signatureStudioRoute = (organizationId: string) =>
  `/admin/o/${encodeURIComponent(organizationId)}/tools/signature-studio`;
