"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = {
  label: string;
  href: string;
};

export const SideNav = ({ title, subtitle, items }: { title: string; subtitle?: string; items: NavItem[] }) => {
  const pathname = usePathname();

  return (
    <aside className="side-nav">
      <div className="side-nav-header">
        <p className="label uppercase tracking-[0.2em]">Menu</p>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <nav className="side-nav-items">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`side-nav-item ${active ? "is-active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
