import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { FirebaseAuthProvider } from "./auth";
import {
  AdminShell,
  AuthGate,
  OrganizationGate,
  PlatformProvider,
  ToolCatalogPage,
  ToolGate,
} from "./platform";
import { NewSignaturePage, SignatureStudioHomePage } from "./signature-studio";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

function ForbiddenPage() {
  return <main className="centered panel"><h1>Accès refusé</h1><p>Droit ou organisation non autorisé.</p></main>;
}

function RoutedApplication() {
  return (
    <AuthGate>
      <PlatformProvider>
        <AdminShell>
          <Routes>
            <Route path="/" element={<Navigate to="/admin/tools" replace />} />
            <Route path="/admin/tools" element={<ToolCatalogPage />} />
            <Route path="/admin/forbidden" element={<ForbiddenPage />} />
            <Route
              path="/admin/o/:organizationId/tools/signature-studio"
              element={<OrganizationGate><ToolGate toolId="signature-studio"><SignatureStudioHomePage /></ToolGate></OrganizationGate>}
            />
            <Route
              path="/admin/o/:organizationId/tools/signature-studio/signatures/new"
              element={<OrganizationGate><ToolGate toolId="signature-studio"><NewSignaturePage /></ToolGate></OrganizationGate>}
            />
            <Route path="*" element={<Navigate to="/admin/tools" replace />} />
          </Routes>
        </AdminShell>
      </PlatformProvider>
    </AuthGate>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseAuthProvider>
        <BrowserRouter>
          <RoutedApplication />
        </BrowserRouter>
      </FirebaseAuthProvider>
    </QueryClientProvider>
  );
}
