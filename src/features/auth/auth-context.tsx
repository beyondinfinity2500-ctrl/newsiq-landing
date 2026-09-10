"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@/lib/supabase/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
  refresh: () => Promise<void>;
}

const fallbackAuthContext: AuthState = {
  user: null,
  profile: null,
  role: "visitor",
  loading: true,
  refresh: async () => {},
};

export interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>(fallbackAuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(fallbackAuthContext);

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) {
      setState({ user: null, profile: null, role: "visitor", loading: false, refresh: async () => {} });
      return;
    }
    setState((prev) => ({ ...prev, loading: false }));
  }, []);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
