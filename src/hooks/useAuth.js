import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

export function useAuthInit() {
  const { setSession, setProfile, setLoading, reset } = useAuthStore();

  useEffect(() => {
    let active = true;

    // 1. Get initial session
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (!data.session) setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        reset();
        setLoading(false);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [setSession, setLoading, reset]);

  // 3. Load profile whenever user changes
  const user = useAuthStore((s) => s.user);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setProfile(data);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, setProfile, setLoading]);
}

/** Convenience hook for components */
export function useAuth() {
  return useAuthStore();
}
