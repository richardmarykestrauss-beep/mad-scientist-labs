import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, dataMode } from "@/lib/supabase";
import { getCheckInRepository, type UserProfile } from "@/repositories/checkInRepository";
import { clearPilotSessionCaches } from "@/lib/pilotSession";

interface AuthContextType {
  user: User | { email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const repository = getCheckInRepository();

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Authentication failed.";
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (sessionUser: User): Promise<UserProfile> => {
    clearPilotSessionCaches();
    const nextProfile = await repository.getCurrentUserProfile();
    if (!nextProfile || nextProfile.status !== "active") {
      throw new Error("This account does not have an active pilot profile.");
    }
    setUser(sessionUser);
    setProfile(nextProfile);
    setError(null);
    return nextProfile;
  }, []);

  useEffect(() => {
    let active = true;
    if (dataMode !== "supabase") {
      repository.getCurrentUserProfile().then((nextProfile) => {
        if (!active) return;
        setProfile(nextProfile);
        setUser(nextProfile ? { email: nextProfile.role === "coach" ? "warren@example.com" : "marcus.reign@example.com" } : null);
        setLoading(false);
      });
      return () => { active = false; };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase mode is not configured.");
      setLoading(false);
      return () => { active = false; };
    }

    void supabase.auth.getSession().then(async ({ data: { session }, error: sessionError }) => {
      if (!active) return;
      try {
        if (sessionError) throw sessionError;
        if (session?.user) await loadProfile(session.user);
      } catch (caught) {
        if (active) {
          setUser(null);
          setProfile(null);
          setError(messageFrom(caught));
          await supabase.auth.signOut();
        }
      } finally {
        if (active) setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_OUT" || !session?.user) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      void loadProfile(session.user)
        .catch((caught) => {
          if (!active) return;
          setUser(null);
          setProfile(null);
          setError(messageFrom(caught));
        })
        .finally(() => { if (active) setLoading(false); });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = async (email: string, password: string): Promise<UserProfile> => {
    setError(null);
    if (dataMode !== "supabase") {
      const role = email.toLowerCase().includes("warren") || email.toLowerCase().includes("coach") ? "coach" : "client";
      localStorage.setItem("demo-session-role", role);
      localStorage.setItem("demo-session-user-id", role === "coach" ? "coach-1" : "c-001");
      const nextProfile = await repository.getCurrentUserProfile();
      if (!nextProfile) throw new Error("Demo profile not found.");
      setProfile(nextProfile);
      setUser({ email });
      return nextProfile;
    }

    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase mode is not configured.");
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;
    if (!data.user) throw new Error("Authentication succeeded without a user session.");
    try {
      return await loadProfile(data.user);
    } catch (caught) {
      await supabase.auth.signOut();
      throw caught;
    }
  };

  const signOut = async () => {
    setError(null);
    setUser(null);
    setProfile(null);
    clearPilotSessionCaches();
    if (dataMode !== "supabase") {
      localStorage.removeItem("demo-session-role");
      localStorage.removeItem("demo-session-user-id");
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase mode is not configured.");
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context) return context;
  if (dataMode === "supabase") {
    throw new Error("useAuth must be used within AuthProvider in Supabase mode.");
  }
  return {
    user: { email: "demo-client@example.invalid" },
    profile: { id: "c-001", fullName: "Demo Client", role: "client", status: "active" },
    loading: false,
    signIn: async () => ({ id: "c-001", fullName: "Demo Client", role: "client", status: "active" }),
    signOut: async () => undefined,
    error: null,
  };
};
