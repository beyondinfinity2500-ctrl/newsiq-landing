"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@/lib/supabase/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  role: "visitor",
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    role: "visitor",
    loading: true,
  });

  const fetchProfile = async (userId: string) => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    return data as Profile | null;
  };

  const refresh = async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      setState({
        user: session.user,
        profile,
        role: profile?.role ?? "user",
        loading: false,
      });
    } else {
      setState({ user: null, profile: null, role: "visitor", loading: false });
    }
  };

  useEffect(() => {
    void refresh();

    const supabase = createSupabaseBrowserClient();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        (async () => {
          if (session?.user) {
            const profile = await fetchProfile(session.user.id);
            setState({
              user: session.user,
              profile,
              role: profile?.role ?? "user",
              loading: false,
            });
          } else {
            setState({ user: null, profile: null, role: "visitor", loading: false });
          }
        })();
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
