"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, roleRoute } from "@/components/auth/AuthProvider";

export const PublicOnlyGuard = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(roleRoute(user.role));
    }
  }, [loading, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="muted">Loading...</p>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
};
