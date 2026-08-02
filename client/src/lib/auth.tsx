"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { BrowserProvider } from "ethers";
import { api } from "@/lib/api";

export type UserRole = "SUPER_ADMIN" | "UNIVERSITY_ADMIN" | "STUDENT" | "EMPLOYER";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: UserRole;
  universityId?: string | null;
  university?: { id: string; name: string; code: string } | null;
  wallet?: { address: string; chainId: number } | null;
  isEmailVerified: boolean;
  provider: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string }) => Promise<string>;
  logout: () => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  metamaskLogin: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setSession: (accessToken: string, refreshToken: string, user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const setSession = useCallback((accessToken: string, refreshToken: string, nextUser: AuthUser) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await api.get("/auth/me");
    setUser(data.data);
    localStorage.setItem("user", JSON.stringify(data.data));
  }, []);

  useEffect(() => {
    const boot = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const cached = localStorage.getItem("user");
        if (cached) setUser(JSON.parse(cached));
        if (token) await refreshProfile();
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, [refreshProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post("/auth/login", { email, password });
      setSession(data.data.accessToken, data.data.refreshToken, data.data.user);
    },
    [setSession]
  );

  const register = useCallback(async (payload: { email: string; password: string; name: string }) => {
    const { data } = await api.post("/auth/register", payload);
    return data.message as string;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const googleLogin = useCallback(
    async (idToken: string) => {
      const { data } = await api.post("/auth/google", { idToken });
      setSession(data.data.accessToken, data.data.refreshToken, data.data.user);
    },
    [setSession]
  );

  const metamaskLogin = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask is not installed");
    const provider = new BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    const { data: nonceRes } = await api.post("/auth/metamask/nonce", { address });
    const signature = await signer.signMessage(nonceRes.data.message);
    const { data } = await api.post("/auth/metamask", {
      address,
      signature,
      name: `Wallet ${address.slice(0, 8)}`,
    });
    setSession(data.data.accessToken, data.data.refreshToken, data.data.user);
  }, [setSession]);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      googleLogin,
      metamaskLogin,
      refreshProfile,
      setSession,
    }),
    [user, loading, login, register, logout, googleLogin, metamaskLogin, refreshProfile, setSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, cb: (...args: unknown[]) => void) => void;
    };
  }
}
