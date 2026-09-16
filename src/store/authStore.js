import { create } from "zustand";

export const useAuthStore = create((set) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,

  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  reset: () =>
    set({ session: null, user: null, profile: null, loading: false }),
}));
