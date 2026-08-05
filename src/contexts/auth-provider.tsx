"use client";

import AuthModal from "@/components/auth-modal";
import { useAuthStore } from "@/stores/auth-store";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface User {
  id?: string;
  name?: string;
  email: string;
  cpf?: string;
  cnpj?: string;
  phone?: string;
  birthDate?: string;
  role: string;
  companyId?: string;
  photoUrl?: string;
  tradeName?: string;
  legalName?: string;
  logo_url?: string;
  cover_url?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  showAuthModal: (tab?: "login" | "register") => void;
  hideAuthModal: () => void;
  login: (userData?: User) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
  hasPermission: (allowedRoles: string[]) => boolean;
  isOwner: () => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isClient: () => boolean;
  isRestaurantStaff: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">(
    "login",
  );

  // Usar Zustand store como fonte única da verdade
  const authStore = useAuthStore();
  const storeLogout = useAuthStore((s) => s.logout);

  // Listen for 401 unauthorized events from API layer
  useEffect(() => {
    const handleUnauthorized = () => {
      storeLogout();
      setIsAuthModalOpen(true);
      setAuthModalTab("login");
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [storeLogout]);

  const showAuthModal = (tab: "login" | "register" = "login") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const hideAuthModal = () => setIsAuthModalOpen(false);

  const login = (userData?: User) => {
    if (userData) {
      // Usar o método login do store Zustand
      // O token já deve estar definido antes de chamar login
      const token = authStore.token || "";
      authStore.login(userData as any, token);
      hideAuthModal();
    }
  };

  const logout = () => {
    authStore.logout();
  };

  const updateUser = (userData: User) => {
    authStore.updateUser(userData as any);
  };

  const hasPermission = (allowedRoles: string[]): boolean => {
    if (!authStore.isAuthenticated || !authStore.user) return false;
    return allowedRoles.includes(authStore.user.role);
  };

  const isOwner = (): boolean => {
    return authStore.user?.role === "owner";
  };

  const isAdmin = (): boolean => {
    return authStore.user?.role === "admin";
  };

  const isManager = (): boolean => {
    return authStore.user?.role === "manager";
  };

  const isClient = (): boolean => {
    return authStore.user?.role === "client";
  };

  const isRestaurantStaff = (): boolean => {
    return hasPermission(["owner", "admin", "manager"]);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: authStore.isAuthenticated,
        user: authStore.user as User | null,
        showAuthModal,
        hideAuthModal,
        login,
        logout,
        updateUser,
        hasPermission,
        isOwner,
        isAdmin,
        isManager,
        isClient,
        isRestaurantStaff,
      }}
    >
      {children}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={hideAuthModal}
        onAuthSuccess={(userData) => login(userData)}
        defaultTab={authModalTab}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
