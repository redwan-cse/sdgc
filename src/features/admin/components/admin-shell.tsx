"use client";

import type * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface AdminShellProps {
  children: React.ReactNode;
  activeRole?: string;
}

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: "dashboard" },
  { href: "/admin/members", label: "Members & Approvals", icon: "users" },
  { href: "/admin/dues", label: "Dues & Reconciliation", icon: "credit-card" },
  { href: "/admin/events", label: "Events & Scheduling", icon: "calendar" },
  { href: "/admin/media", label: "Media & Albums", icon: "photograph" },
  { href: "/admin/content", label: "Pages & Copy", icon: "document-text" },
  { href: "/admin/messages", label: "Contact Inbox", icon: "inbox" },
];

export function AdminShell({ children, activeRole = "Administrator" }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col md:flex-row border-t border-border">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 shrink-0 border-r border-border bg-sidebar p-4 space-y-6">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-sidebar-border">
            <span className="font-serif text-lg font-bold text-sidebar-primary">
              Club Administration
            </span>
            <Badge variant="secondary">{activeRole}</Badge>
          </div>
          <p className="mt-2 text-xs text-sidebar-foreground/70">
            RBAC Protected Portal &bull; SDGC
          </p>
        </div>

        <nav aria-label="Admin Navigation" className="space-y-1">
          {ADMIN_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href as Route}
                className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border pt-4 text-xs text-sidebar-foreground/60 space-y-2">
          <p className="font-semibold text-sidebar-foreground">Parity Requirement:</p>
          <p>
            Replaces legacy WordPress admin panel with real local RBAC, content management, member
            approval, and payment reconciliation.
          </p>
          <Link href="/" className="block pt-2 text-primary hover:underline font-medium">
            &larr; View Public Site
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 bg-background overflow-y-auto">{children}</main>
    </div>
  );
}
