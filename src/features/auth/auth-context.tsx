"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@/lib/supabase/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Check if Supabase is available by creating the client
const supabaseClient = createSupabaseBrowserClient();
const isSupabaseAvailable = supabaseClient !== null;

// Type for auth state including refresh function
interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
  refresh: () => Promise<void>;
}

// Fallback context when Supabase is not available
const fallbackAuthContext = {
  user: null,
  profile: null,
  role: "visitor" as UserRole,
  loading: true,
  refresh: async () => {},
};

const AuthContext = createContext<AuthContextValue>(fallbackAuthContext);

export interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initial state based on Supabase availability
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    role: isSupabaseAvailable ? "visitor" as UserRole : "visitor" as UserRole,
    loading: !isSupabaseAvailable,
    refresh: async () => {},
  });

  const refresh = async () => {
    setState({
      user: null,
      profile: null,
      role: "visitor" as UserRole,
      loading: !isSupabaseAvailable,
      refresh: async () => {},
    });
  };

  useEffect(() => {
    void refresh();
  }, [isSupabaseAvailable]);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}