import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { usePlatform } from "./platform";

interface BrandProfile {
  id: string;
  slug: string;
  displayName: string;
  descriptor: string;
  accentColor: string;
  productId?: string | null;
}

interface BootstrapPayload {
  toolId: string;
  planCode: string;
  capabilities: string[];
  quotas: Record<string, number>;
  brandProfiles: BrandProfile[];
  imageModeDefault: "hosted";
  approvalPolicy: "editor_manager";
  integrationOrder: string[];
}

interface PreviewResponse {
  html: string;
  text: string;
  renderHash: string;
  engineVersion: string;
  warnings: string[];
}

export function SignatureStudioHomePage() {
  const { organizationId } = useParams();
  const { api } = usePlatform();
  const bootstrap = useQuery({
    queryKey: ["signature-studio-bootstrap", organizationId],
    enabled: Boolean(organizationId),
    queryFn: () => api.get<BootstrapPayload>(
      `/api/v1/organizations/${organizationId}/signature-studio/bootstrap`,
    ),
  });

  if (bootstrap.isLoading) return <p>Chargement de Signature Studio…</p>;
  if (bootstrap.isError) return <p>Le module n’est pas disponible pour cette organisation.</p>;
  const data = bootstrap.data!;

  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Outil commercialisable</p>
          <h1>JRbIA Signature Studio</h1>
          <p>Créer, valider, versionner et exporter des signatures e-mail de marque.</p>
        </div>
        <Link className="button" to={`/admin/o/${organizationId}/tools/signature-studio/signatures/new`}>
          Nouvelle signature
        </Link>
      </div>
      <div className="metric-grid">
        <article className="metric"><strong>{data.brandProfiles.length}</strong><span>profils de marque</span></article>
        <article className="metric"><strong>{data.planCode}</strong><span>plan actif</span></article>
        <article className="metric"><strong>{data.imageModeDefault}</strong><span>mode image par défaut</span></article>
        <article className="metric"><strong>{data.approvalPolicy}</strong><span>workflow de validation</span></article>
      </div>
      <section className="panel">
        <h2>Ordre d’intégration produits</h2>
        <ol>{data.integrationOrder.map((product) => <li key={product}>{product}</li>)}</ol>
      </section>
    </div>
  );
}

export function NewSignaturePage() {
  const { organizationId } = useParams();
  const { api } = usePlatform();
  const [fullName, setFullName] = useState("Julien Riotte-Bronoël");
  const [jobTitle, setJobTitle] = useState("Direction JRbIA");
  const [email, setEmail] = useState("julie@riotte.work");
  const [phone, setPhone] = useState("+33745155228");
  const [brandProfileId, setBrandProfileId] = useState("jrbia");

  const bootstrap = useQuery({
    queryKey: ["signature-studio-bootstrap", organizationId],
    enabled: Boolean(organizationId),
    queryFn: () => api.get<BootstrapPayload>(
      `/api/v1/organizations/${organizationId}/signature-studio/bootstrap`,
    ),
  });

  const preview = useMutation({
    mutationFn: () => api.post<PreviewResponse>(
      `/api/v1/organizations/${organizationId}/signature-studio/preview`,
      {
        brandProfileId,
        templateCode: "jrbia-standard-v1",
        imageMode: "hosted",
        person: {
          fullName,
          jobTitle,
          email,
          phoneE164: phone,
          websiteUrl: "https://jrbia-site.jaimebrantome.chatgpt.site",
          locale: "fr-FR",
        },
      },
    ),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    preview.mutate();
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Signature Studio</p>
          <h1>Nouvelle signature</h1>
        </div>
      </div>
      <div className="split-view">
        <form className="panel form-grid" onSubmit={submit}>
          <label>Profil de marque
            <select value={brandProfileId} onChange={(e) => setBrandProfileId(e.target.value)}>
              {(bootstrap.data?.brandProfiles ?? []).map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.displayName}</option>
              ))}
            </select>
          </label>
          <label>Nom complet<input required value={fullName} onChange={(e) => setFullName(e.target.value)} /></label>
          <label>Fonction<input required value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} /></label>
          <label>E-mail<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Téléphone E.164<input value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
          <button className="button" type="submit" disabled={preview.isPending}>Prévisualiser</button>
        </form>
        <section className="panel preview-panel">
          <h2>Aperçu assaini</h2>
          {preview.data ? (
            <>
              <iframe title="Aperçu de signature" sandbox="" srcDoc={preview.data.html} />
              <code>{preview.data.renderHash}</code>
            </>
          ) : <p>Le rendu sera généré côté FastAPI avec des actifs HTTPS contrôlés.</p>}
        </section>
      </div>
    </div>
  );
}
