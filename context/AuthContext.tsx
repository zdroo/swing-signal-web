"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, setOnUnauthorized } from "@/lib/api";
import { track } from "@/lib/analytics";

interface AuthUser {
  email: string;
  plan: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
  // Re-issues the token so a server-side plan change (e.g. a Stripe upgrade)
  // is reflected in the claim without making the user log out and back in.
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // The access token lives only in memory, so a reload starts logged-out until
  // we rehydrate from the HttpOnly refresh cookie. One /auth/refresh on mount
  // both restores the token and tells us who the user is (or that there's no
  // session). Post-mount (not a lazy initializer) to stay SSR-hydration-safe.
  useEffect(() => {
    // A silent-refresh failure mid-session (revoked/expired) drops us to logged-out
    setOnUnauthorized(() => setUser(null));

    api
      .refresh()
      .then((auth) => setUser({ email: auth.email, plan: auth.plan }))
      .catch(() => setUser(null)) // no valid session — stay anonymous
      .finally(() => setLoading(false));

    return () => setOnUnauthorized(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const auth = await api.login(email, password);
    setUser({ email: auth.email, plan: auth.plan });
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const auth = await api.register(email, password);
    setUser({ email: auth.email, plan: auth.plan });
    track("signup_completed", { method: "email" });
  }, []);

  const googleLogin = useCallback(async (idToken: string) => {
    const auth = await api.googleLogin(idToken);
    setUser({ email: auth.email, plan: auth.plan });
    track("signup_completed", { method: "google" });
  }, []);

  const logout = useCallback(() => {
    // Drop the UI to logged-out immediately; revoke the session + clear the
    // cookie server-side in the background (best-effort).
    setUser(null);
    void api.logout();
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const auth = await api.refresh();
      setUser({ email: auth.email, plan: auth.plan });
    } catch {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, googleLogin, logout, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
