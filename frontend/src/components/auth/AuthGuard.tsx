"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, roleRoute } from "@/components/auth/AuthProvider";
import { Role } from "@/lib/api";

export const AuthGuard = ({ children, role }: { children: React.ReactNode; role?: Role }) => {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (role && user.role !== role) {
      router.replace(roleRoute(user.role));
    }
  }, [loading, role, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="muted">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (role && user.role !== role) {
    return null;
  }

  return <>{children}</>;
};
