import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isGuest: boolean;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setGuest: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isGuest: false,
  isLoading: true,
  setSession: (session) =>
    set({ session, user: session?.user ?? null, isLoading: false }),
  setGuest: (value) =>
    set({ isGuest: value, isLoading: false }),
  setLoading: (value) =>
    set({ isLoading: value }),
  clear: () =>
    set({ user: null, session: null, isGuest: false, isLoading: false }),
}));