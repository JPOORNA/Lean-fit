"use client";

import { ReactNode } from "react";
import { Role } from "@/lib/api";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { SideNav, NavItem } from "@/components/layout/SideNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";

export const RoleLayout = ({
  role,
  title,
  subtitle,
  navItems,
  children
}: {
  role: Role;
  title: string;
  subtitle?: string;
  navItems: NavItem[];
  children: ReactNode;
}) => {
  const router = useRouter();
  const { logout, user } = useAuth();

  const onLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <AuthGuard role={role}>
      <div className="app-shell">
        <header className="app-header">
          <div className="app-header-left">
            <span className="text-sm font-semibold uppercase tracking-[0.18em]">NutriTrack</span>
            <span className="text-xs uppercase tracking-[0.16em]">{title}</span>
          </div>
          <div className="app-header-actions">
            <span className="text-sm">{user?.name ?? ""}</span>
            <ThemeToggle />
            <button className="btn btn-ghost" onClick={onLogout}>
              Log out
            </button>
          </div>
        </header>

        <div className="app-main">
          <aside className="app-sidebar">
            <SideNav title={title} subtitle={subtitle} items={navItems} />
          </aside>
          <main className="app-content">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
};
