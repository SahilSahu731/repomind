import { create } from "zustand";
import type { Plan } from "@/lib/supabaseDb";

interface StoredUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  plan: Plan;
  creditsRemaining: number;
  githubUsername: string | null;
}

interface UserStoreState {
  user: StoredUser | null;
  setUser: (user: StoredUser) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStoreState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
