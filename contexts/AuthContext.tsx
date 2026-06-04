"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { clearStaffToken, getStaffToken, nestApi, setStaffToken, type StaffUser } from "@/lib/nest-api";

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
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await nestApi.getStaffProfile(token);
      setUser(profile);
    } catch {
      clearStaffToken();
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
    clearStaffToken();
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
