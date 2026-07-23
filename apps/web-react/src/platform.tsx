import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import type { CatalogTool, OrganizationMembership } from "@jrbia/shared";
import { ApiClient } from "./api";
import { useAuth } from "./auth";

interface PlatformContextValue {
  api: ApiClient;
  memberships: OrganizationMembership[];
  selectedOrganizationId: string | null;
  selectOrganization: (organizationId: string) => void;
  catalog: CatalogTool[];
  isCatalogLoading: boolean;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const api = useMemo(
    () => new ApiClient(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000", auth.getToken),
    [auth.getToken],
  );

  const membershipsQuery = useQuery({
    queryKey: ["memberships", auth.user?.id],
    enabled: auth.status === "authenticated",
    queryFn: () => api.get<OrganizationMembership[]>("/api/v1/me/organizations"),
    staleTime: 60_000,
  });

  const memberships = membershipsQuery.data ?? [];
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(
    () => window.localStorage.getItem("jrbia.organization"),
  );

  useEffect(() => {
    if (!memberships.length) return;
    if (!selectedOrganizationId || !memberships.some((m) => m.organizationId === selectedOrganizationId)) {
      setSelectedOrganizationId(memberships[0].organizationId);
    }
  }, [memberships, selectedOrganizationId]);

  const catalogQuery = useQuery({
    queryKey: ["catalog", selectedOrganizationId],
    enabled: auth.status === "authenticated" && Boolean(selectedOrganizationId),
    queryFn: () =>
      api.get<CatalogTool[]>(
        `/api/v1/organizations/${encodeURIComponent(selectedOrganizationId!)}/catalog/tools`,
      ),
    staleTime: 30_000,
  });

  const value = useMemo<PlatformContextValue>(
    () => ({
      api,
      memberships,
      selectedOrganizationId,
      selectOrganization: (organizationId) => {
        if (!memberships.some((membership) => membership.organizationId === organizationId)) {
          throw new Error("Organisation non autorisée.");
        }
        window.localStorage.setItem("jrbia.organization", organizationId);
        setSelectedOrganizationId(organizationId);
      },
      catalog: catalogQuery.data ?? [],
      isCatalogLoading: catalogQuery.isLoading,
    }),
    [api, catalogQuery.data, catalogQuery.isLoading, memberships, selectedOrganizationId],
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform(): PlatformContextValue {
  const value = useContext(PlatformContext);
  if (!value) throw new Error("usePlatform doit être utilisé dans PlatformProvider.");
  return value;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);
    try {
      await auth.signInWithPassword(email.trim(), password);
      setPassword("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connexion impossible.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (auth.status === "loading") return <main className="centered">Chargement de l’identité…</main>;
  if (auth.status === "locked") {
    return (
      <main className="centered panel">
        <h1>Client verrouillé</h1>
        <p>{auth.reason}</p>
        <p>Aucun mode de contournement d’authentification n’est activé.</p>
      </main>
    );
  }
  if (auth.status === "signed_out") {
    return (
      <main className="auth-layout">
        <section className="auth-intro">
          <p className="eyebrow">Cockpit sécurisé</p>
          <h1>Bienvenue dans JRbIA</h1>
          <p>L’intelligence artificielle utile aux métiers, dans un espace isolé par organisation.</p>
          <ul className="auth-benefits">
            <li>🔐 Session gérée par Supabase Auth</li>
            <li>🛡️ Données protégées par RLS</li>
            <li>🏢 Accès limité à vos organisations</li>
          </ul>
        </section>
        <form className="panel auth-card" onSubmit={submit}>
          <div>
            <p className="eyebrow">Accès professionnel</p>
            <h2>Se connecter</h2>
            <p>Utilisez le compte préalablement autorisé par JRbIA.</p>
          </div>
          <label>
            Adresse e-mail
            <input
              autoComplete="email"
              inputMode="email"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Mot de passe
            <input
              autoComplete="current-password"
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Connexion…" : "Accéder au cockpit"}
          </button>
          <p className="form-note">L’inscription libre est désactivée. Contactez l’administrateur JRbIA pour obtenir un accès.</p>
        </form>
      </main>
    );
  }
  return <>{children}</>;
}

export function OrganizationGate({ children }: { children: ReactNode }) {
  const { organizationId } = useParams();
  const { memberships, selectedOrganizationId, selectOrganization } = usePlatform();
  const isAuthorized = Boolean(
    organizationId && memberships.some((membership) => membership.organizationId === organizationId),
  );

  useEffect(() => {
    if (organizationId && isAuthorized && selectedOrganizationId !== organizationId) {
      selectOrganization(organizationId);
    }
  }, [isAuthorized, organizationId, selectOrganization, selectedOrganizationId]);

  if (!organizationId) return <Navigate to="/admin/tools" replace />;
  if (!isAuthorized) return <Navigate to="/admin/forbidden" replace />;
  if (selectedOrganizationId !== organizationId) {
    return <main className="centered">Changement d’organisation…</main>;
  }
  return <>{children}</>;
}

export function ToolGate({ toolId, children }: { toolId: string; children: ReactNode }) {
  const { catalog, isCatalogLoading } = usePlatform();
  if (isCatalogLoading) return <main className="centered">Chargement des droits…</main>;
  if (!catalog.some((tool) => tool.toolId === toolId)) {
    return <Navigate to="/admin/forbidden" replace />;
  }
  return <>{children}</>;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const { memberships, selectedOrganizationId, selectOrganization, catalog } = usePlatform();
  const location = useLocation();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    try {
      await auth.signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/admin/tools" className="brand">JRbIA</Link>
        <span className="tagline">L’IA utile aux métiers.</span>
        <select
          aria-label="Organisation active"
          value={selectedOrganizationId ?? ""}
          onChange={(event) => selectOrganization(event.target.value)}
        >
          {memberships.map((membership) => (
            <option key={membership.organizationId} value={membership.organizationId}>
              {membership.organizationName}
            </option>
          ))}
        </select>
        <button className="topbar-action" disabled={isSigningOut} onClick={signOut} type="button">
          {isSigningOut ? "Déconnexion…" : "Se déconnecter"}
        </button>
      </header>
      <aside className="sidebar">
        <Link className={location.pathname === "/admin/tools" ? "active" : ""} to="/admin/tools">
          Catalogue
        </Link>
        {selectedOrganizationId && catalog.map((tool) => (
          <Link key={tool.toolId} to={`/admin/o/${selectedOrganizationId}${tool.route}`}>
            {tool.displayName}
          </Link>
        ))}
      </aside>
      <section className="content">{children}</section>
    </div>
  );
}

export function ToolCatalogPage() {
  const { catalog, selectedOrganizationId, isCatalogLoading } = usePlatform();
  if (isCatalogLoading) return <p>Chargement du catalogue…</p>;
  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Catalogue commercial</p>
          <h1>Outils JRbIA</h1>
        </div>
        <span className="status-pill">Feature flags par organisation</span>
      </div>
      <div className="tool-grid">
        {catalog.map((tool) => (
          <article className="tool-card" key={tool.toolId}>
            <p className="eyebrow">{tool.status}</p>
            <h2>{tool.displayName}</h2>
            <p>{tool.description}</p>
            {selectedOrganizationId && (
              <Link className="button" to={`/admin/o/${selectedOrganizationId}${tool.route}`}>
                Ouvrir
              </Link>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
