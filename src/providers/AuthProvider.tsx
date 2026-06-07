"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import { AuthModal } from "@/components/auth/AuthModal";
import { OnboardingModal } from "@/components/auth/OnboardingModal";
import {
  clearAccessToken,
  completeOnboarding as completeOnboardingRequest,
  getCurrentUser,
  loginWithPassword,
  logout as logoutRequest,
  markOffline,
  registerAccount,
  refreshSession,
  saveAccessToken,
  type AuthUser
} from "@/lib/auth-client";

type AuthStatus = "checking" | "guest" | "authenticated";

type AuthContextValue = {
  authModalOpen: boolean;
  closeAuth: () => void;
  completeOnboarding: () => Promise<void>;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  onboardingOpen: boolean;
  openAuth: () => void;
  register: (
    displayName: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<void>;
  requireAuth: () => boolean;
  refreshUser: () => Promise<void>;
  status: AuthStatus;
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    refreshSession()
      .then((session) => {
        if (!mounted) return;
        setUser(session.user);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!mounted) return;
        clearAccessToken();
        setUser(null);
        setStatus("guest");
      });

    return () => {
      mounted = false;
    };
  }, []);

  const openAuth = useCallback(() => setAuthModalOpen(true), []);
  const closeAuth = useCallback(() => setAuthModalOpen(false), []);
  const showOnboarding = useCallback(() => setOnboardingOpen(true), []);

  const login = useCallback(async (email: string, password: string) => {
    const session = await loginWithPassword(email, password);
    saveAccessToken(session.accessToken);
    setUser(session.user);
    setStatus("authenticated");
    setAuthModalOpen(false);

    if (session.needsOnboarding) {
      showOnboarding();
    }
  }, [showOnboarding]);

  const register = useCallback(async (
    displayName: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => {
    const session = await registerAccount(displayName, email, password, confirmPassword);
    saveAccessToken(session.accessToken);
    setUser(session.user);
    setStatus("authenticated");
    setAuthModalOpen(false);
    showOnboarding();
  }, [showOnboarding]);

  const logout = useCallback(() => {
    markOffline();
    void logoutRequest().catch(() => undefined);
    clearAccessToken();
    setUser(null);
    setStatus("guest");
  }, []);

  useEffect(() => {
    const handlePageHide = () => {
      markOffline();
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  const requireAuth = useCallback(() => {
    if (status === "authenticated") {
      return true;
    }

    openAuth();
    return false;
  }, [openAuth, status]);

  const refreshUser = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setStatus("authenticated");
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      await completeOnboardingRequest();
    } finally {
      setOnboardingOpen(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authModalOpen,
      closeAuth,
      completeOnboarding,
      isGuest: status === "guest",
      login,
      logout,
      onboardingOpen,
      openAuth,
      register,
      requireAuth,
      refreshUser,
      status,
      user
    }),
    [
      authModalOpen,
      closeAuth,
      completeOnboarding,
      login,
      logout,
      onboardingOpen,
      openAuth,
      register,
      requireAuth,
      refreshUser,
      status,
      user
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal />
      <OnboardingModal />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
