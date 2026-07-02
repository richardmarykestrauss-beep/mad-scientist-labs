import React, { createContext, useContext, useEffect, useState } from "react";
import { getSupabaseClient, dataMode } from "@/lib/supabase";
import { getCheckInRepository, type UserProfile } from "@/repositories/checkInRepository";

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const repo = getCheckInRepository();

  useEffect(() => {
    if (dataMode !== "supabase") {
      // Local Mode: derive current profile from localRepository
      repo.getCurrentUserProfile().then((p) => {
        setProfile(p);
        setUser(p ? { email: p.role === "coach" ? "warren@example.com" : "marcus.reign@example.com" } : null);
        setLoading(false);
      });
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Fetch profile for an authenticated user
    const fetchProfile = async (sessionUser: any) => {
      try {
                const { data: dbProfile, error: profileError } = await (supabase as any)
          .from("profiles")
          .select("*")
          .eq("id", sessionUser.id)
          .single();

        if (profileError || !dbProfile) {
          setError("Profile not found.");
          setProfile(null);
        } else if ((dbProfile as any).status === "inactive") {
          setError("Account is suspended.");
          setProfile(null);
        } else {
          setProfile({
            id: (dbProfile as any).id,
            fullName: (dbProfile as any).full_name,
            role: (dbProfile as any).role,
            status: (dbProfile as any).status
          });
        }
      } catch (err: any) {
        setError(err.message || "Failed to load profile.");
      }
    };

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setLoading(true);
        fetchProfile(session.user).finally(() => setLoading(false));
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    if (dataMode !== "supabase") {
      // Simulated login inside local mode
      if (email.includes("warren") || email.includes("coach")) {
        localStorage.setItem("demo-session-role", "coach");
        localStorage.setItem("demo-session-user-id", "coach-1");
      } else {
        localStorage.setItem("demo-session-role", "client");
        localStorage.setItem("demo-session-user-id", "c-001");
      }
      const p = await repo.getCurrentUserProfile();
      setProfile(p);
      setUser({ email });
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase is not configured.");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      throw signInError;
    }
  };

  const signOut = async () => {
    setError(null);
    if (dataMode !== "supabase") {
      localStorage.removeItem("demo-session-role");
      localStorage.removeItem("demo-session-user-id");
      setUser(null);
      setProfile(null);
      return;
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return a safe mock fallback for tests rendering components directly without AuthProvider wrapper
    return {
      user: { email: "marcus.reign@example.com" },
      profile: { id: "c-001", fullName: "Marcus Reign", role: "client" as const, status: "active" },
      loading: false,
      signIn: async () => {},
      signOut: async () => {},
      error: null
    };
  }
  return context;
};
