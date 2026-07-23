import { createClient, type Session, type User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface AuthState {
  status: "loading" | "locked" | "authenticated" | "signed_out";
  user: User | null;
  reason?: string;
  getToken: () => Promise<string>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function createSupabaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  return createClient(url, publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
}

const supabaseClient = createSupabaseClient();

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const client = supabaseClient;
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const [reason, setReason] = useState<string>();

  useEffect(() => {
    if (!client) {
      setReason("Configuration Supabase absente : le client reste verrouillé par défaut.");
      setStatus("locked");
      return;
    }

    let active = true;
    void client.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setReason(error.message);
        setStatus("locked");
        return;
      }
      setSession(data.session);
      setStatus(data.session ? "authenticated" : "signed_out");
    });

    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStatus(nextSession ? "authenticated" : "signed_out");
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  const value = useMemo<AuthState>(
    () => ({
      status,
      user: session?.user ?? null,
      reason,
      getToken: async () => {
        if (!session?.access_token) throw new Error("Aucune session Supabase authentifiée.");
        return session.access_token;
      },
      signInWithPassword: async (email, password) => {
        if (!client) throw new Error("Configuration Supabase absente.");
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signOut: async () => {
        if (!client) throw new Error("Configuration Supabase absente.");
        const { error } = await client.auth.signOut({ scope: "global" });
        if (error) throw error;
      },
    }),
    [client, reason, session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth doit être utilisé dans SupabaseAuthProvider.");
  return value;
}
