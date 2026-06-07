import { apiRequest, ApiClientError, createApiUrl } from "@/lib/api-client";

export type AuthProfile = {
  id: string;
  userId: string;
  displayName: string;
  age: number | null;
  gender: string | null;
  hobbies: string[];
  mood: string | null;
  zodiac: string | null;
  personality: string | null;
  personalityTraits: string[];
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  city: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthUser = {
  id: string;
  email: string;
  role: "GUEST" | "USER" | "PREMIUM" | "ADMIN";
  status: "ACTIVE" | "BLOCKED" | "DELETED";
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  profile: AuthProfile | null;
};

type AuthSession = {
  accessToken: string;
  needsOnboarding: boolean;
  user: AuthUser;
};

const accessTokenKey = "only_us_access_token";
let memoryAccessToken: string | null = null;

function readLocalAccessToken() {
  try {
    return window.localStorage.getItem(accessTokenKey);
  } catch {
    return null;
  }
}

function saveLocalAccessToken(token: string) {
  try {
    window.localStorage.setItem(accessTokenKey, token);
  } catch {
    return;
  }
}

function removeStoredAccessToken() {
  try {
    window.localStorage.removeItem(accessTokenKey);
  } catch {
    return;
  }

  try {
    window.sessionStorage.removeItem(accessTokenKey);
  } catch {
    return;
  }
}

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  if (memoryAccessToken) {
    return memoryAccessToken;
  }

  const stored = readLocalAccessToken();
  if (stored) {
    memoryAccessToken = stored;
    return stored;
  }

  return null;
}

export function saveAccessToken(token: string) {
  memoryAccessToken = token;

  if (typeof window !== "undefined") {
    saveLocalAccessToken(token);
  }
}

export function clearAccessToken() {
  memoryAccessToken = null;

  if (typeof window !== "undefined") {
    removeStoredAccessToken();
  }
}

export async function loginWithPassword(email: string, password: string) {
  const session = await apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: email.trim(), password })
  });

  saveAccessToken(session.accessToken);
  return session;
}

export async function registerAccount(
  displayName: string,
  email: string,
  password: string,
  confirmPassword: string
) {
  const session = await apiRequest<AuthSession>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      displayName: displayName.trim(),
      email: email.trim(),
      password,
      confirmPassword
    })
  });

  saveAccessToken(session.accessToken);
  return session;
}

export async function requestPasswordReset(email: string) {
  return apiRequest<{ sent: boolean; emailed?: boolean; devOtp?: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: email.trim() })
  });
}

export async function verifyResetOtp(email: string, otp: string) {
  return apiRequest<{ valid: boolean }>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email: email.trim(), otp: otp.trim() })
  });
}

export async function resetPassword(email: string, otp: string, password: string, confirmPassword: string) {
  const result = await apiRequest<{ reset: boolean }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email: email.trim(), otp: otp.trim(), password, confirmPassword })
  });

  clearAccessToken();
  return result;
}

export async function logout() {
  try {
    await apiRequest<{ loggedOut: boolean }>("/auth/logout", {
      method: "POST"
    });
  } finally {
    clearAccessToken();
  }
}

export function markOffline() {
  const token = getAccessToken();
  const headers = new Headers();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  void fetch(createApiUrl("/auth/presence/offline"), {
    method: "POST",
    headers,
    credentials: "include",
    keepalive: true
  }).catch(() => undefined);
}

export async function refreshSession() {
  const token = getAccessToken();
  const headers = new Headers();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const session = await apiRequest<AuthSession>("/auth/refresh-token", {
    method: "POST",
    headers
  });

  saveAccessToken(session.accessToken);
  return session;
}

export async function completeOnboarding() {
  return authRequest<{ completed: boolean }>("/auth/complete-onboarding", {
    method: "POST"
  });
}

export async function authRequest<T>(path: string, init: RequestInit = {}) {
  const token = getAccessToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    return await apiRequest<T>(path, {
      ...init,
      headers
    });
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.status !== 401) {
      throw error;
    }

    const session = await refreshSession();
    const refreshedToken = getAccessToken();

    if (!refreshedToken || !session) {
      throw error;
    }

    const retryHeaders = new Headers(init.headers);
    retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);

    return apiRequest<T>(path, {
      ...init,
      headers: retryHeaders
    });
  }
}

export async function getCurrentUser() {
  const data = await authRequest<{ user: AuthUser }>("/auth/me");
  return data.user;
}
