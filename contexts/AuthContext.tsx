"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { clearAllAuth, clearStaffToken, getStaffToken, nestApi, setStaffToken, type StaffUser } from "@/lib/nest-api";

type User = StaffUser;

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    const token = getStaffToken();
    const refreshTokenPresent = typeof window !== "undefined" && !!window.localStorage.getItem("imo_staff_refresh");

    if (!token && !refreshTokenPresent) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // If only the refresh token remains (access token expired on load), the
      // nest-api layer rotates it transparently. If the access token is present
      // it may still be valid; getStaffProfile will attempt it.
      const profile = await nestApi.getStaffProfile();
      setUser(profile);
    } catch {
      await clearAllAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const data = await nestApi.loginStaff(email, password);
    setStaffToken(data.access_token);
    setUser(data.user);
    if (data.user.role === "DOCTOR" && data.user.isFirstLogin) {
      router.push("/admin/change-password");
      return;
    }
    router.push("/admin");
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await nestApi.changePassword(currentPassword, newPassword);
    setUser((prev) => (prev ? { ...prev, isFirstLogin: false } : prev));
    router.push("/admin");
  };

  const logout = async () => {
    await clearAllAuth();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, changePassword, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
