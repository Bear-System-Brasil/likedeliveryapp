import { STORAGE_KEYS } from "@/utils/storage-manager";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate: string;
  role: string;
  companyId?: string;
  photoUrl?: string;
  tradeName?: string;
  legalName?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        _hasHydrated: false,

        login: (user, token) =>
          set(
            (state) => ({
              user,
              token: token || state.token,
              isAuthenticated: true,
              isLoading: false,
            }),
            false,
            "auth/login",
          ),

        logout: () =>
          set(
            {
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            },
            false,
            "auth/logout",
          ),

        updateUser: (updatedUser) =>
          set(
            (state) => ({
              user: state.user ? { ...state.user, ...updatedUser } : null,
            }),
            false,
            "auth/updateUser",
          ),

        setLoading: (loading) =>
          set({ isLoading: loading }, false, "auth/setLoading"),

        setHasHydrated: (state) =>
          set({ _hasHydrated: state }, false, "auth/setHasHydrated"),
      }),
      {
        name: STORAGE_KEYS.AUTH,
        version: 1,
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
        },
      },
    ),
    { name: "auth-store", enabled: process.env.NODE_ENV !== "production" },
  ),
);
