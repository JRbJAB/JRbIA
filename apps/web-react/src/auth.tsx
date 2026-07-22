import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth, getIdToken, onAuthStateChanged, type User } from "firebase/auth";

interface AuthState {
  status: "loading" | "locked" | "authenticated" | "signed_out";
  user: User | null;
  reason?: string;
  getToken: () => Promise<string>;
}

const AuthContext = createContext<AuthState | null>(null);

function readFirebaseOptions(): FirebaseOptions | null {
  const options: FirebaseOptions = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  if (!options.apiKey || !options.authDomain || !options.projectId || !options.appId) {
    return null;
  }
  return options;
}

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const [reason, setReason] = useState<string>();

  useEffect(() => {
    const options = readFirebaseOptions();
    if (!options) {
      setReason("Configuration Firebase absente : le client reste verrouillé par défaut.");
      setStatus("locked");
      return;
    }

    const app = getApps().length ? getApp() : initializeApp(options);
    const auth = getAuth(app);
    return onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setStatus(nextUser ? "authenticated" : "signed_out");
      },
      (error) => {
        setReason(error.message);
        setStatus("locked");
      },
    );
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      status,
      user,
      reason,
      getToken: async () => {
        if (!user) {
          throw new Error("Aucun utilisateur Firebase authentifié.");
        }
        return getIdToken(user, false);
      },
    }),
    [reason, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth doit être utilisé dans FirebaseAuthProvider.");
  }
  return value;
}
