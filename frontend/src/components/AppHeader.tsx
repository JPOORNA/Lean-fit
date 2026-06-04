"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export const AppHeader = () => {
  return (
    <header className="px-6 sm:px-10 py-6">
      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-4">
        <div className="flex flex-col">
          <span className="text-sm uppercase tracking-[0.2em] muted">Client Portal</span>
          <h1 className="text-2xl font-semibold">Care Workspace</h1>
        </div>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link className="btn btn-ghost" href="/login">
            Login
          </Link>
          <Link className="btn btn-ghost" href="/register">
            Register
          </Link>
          <Link className="btn btn-ghost" href="/client">
            Client
          </Link>
          <Link className="btn btn-ghost" href="/doctor">
            Admin
          </Link>
          <Link className="btn btn-ghost" href="/user">
            User
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
};
