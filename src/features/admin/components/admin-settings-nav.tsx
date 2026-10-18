"use client";

import Link from "next/link";
import type { Route } from "next";

interface AdminSettingsNavProps {
  activeTab: "settings" | "profile" | "security";
  canManageSettings?: boolean;
}

export function AdminSettingsNav({ activeTab, canManageSettings = true }: AdminSettingsNavProps) {
  const tabs = [
    ...(canManageSettings
      ? [
          {
            id: "settings",
            label: "Club Site Settings",
            href: "/admin/settings" as Route,
            badge: "Admin Only",
          },
        ]
      : []),
    {
      id: "profile",
      label: "Admin Profile",
      href: "/admin/settings/profile" as Route,
      badge: "Operator",
    },
    {
      id: "security",
      label: "Security & MFA",
      href: "/admin/settings/security" as Route,
      badge: "AAL2",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${
              isActive
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border/70"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isActive
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {tab.badge}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
