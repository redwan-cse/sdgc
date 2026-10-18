import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { AdminMetrics } from "../types";

interface AdminOverviewProps {
  metrics?: AdminMetrics;
}

export function AdminOverview({ metrics }: AdminOverviewProps) {
  const stats = [
    {
      label: "Active Members",
      sublabel: "Current Term",
      value: metrics ? String(metrics.totalMembers) : "—",
      href: "/admin/members?status=approved",
    },
    {
      label: "Pending Approvals",
      value: metrics ? String(metrics.pendingApprovals) : "—",
      alert: Boolean(metrics && metrics.pendingApprovals > 0),
      href: "/admin/members?status=pending",
    },
    {
      label: "Unreconciled Dues",
      value: metrics ? String(metrics.unreconciledPayments) : "—",
      alert: Boolean(metrics && metrics.unreconciledPayments > 0),
      href: "/admin/dues?status=pending",
    },
    {
      label: "Upcoming Events",
      value: metrics ? String(metrics.upcomingEvents) : "—",
      href: "/admin/events",
    },
    {
      label: "Unread Messages",
      value: metrics ? String(metrics.unreadMessages) : "—",
      alert: Boolean(metrics && metrics.unreadMessages > 0),
      href: "/admin/messages?status=unread",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Administrative Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Club governance, member management, dues reconciliation, and editorial publishing.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href as Route}
            className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-xs hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center justify-between gap-1.5 min-h-[22px]">
              <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
              {stat.alert && (
                <Badge variant="warning" className="shrink-0 text-[10px] px-1.5 py-0.5">
                  Action Needed
                </Badge>
              )}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{stat.value}</span>
              {stat.sublabel && (
                <span className="text-[11px] text-muted-foreground font-medium">
                  ({stat.sublabel})
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-xl font-bold text-foreground">
            Membership & Dues Approvals
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Review pending member applications. Confirm payment status and issue manual membership
            approval as required by SDGC annual dues policies.
          </p>
          <div className="flex gap-3">
            <Link
              href="/admin/members"
              className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Review Pending Members
            </Link>
            <Link
              href="/admin/dues"
              className="rounded-md border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              Reconcile Dues
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-xl font-bold text-foreground">Content, Events & Media</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Create or edit upcoming calendar events, upload and curate albums for the public
            gallery, and publish updates to site pages.
          </p>
          <div className="flex gap-3">
            <Link
              href="/admin/events"
              className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Manage Events
            </Link>
            <Link
              href="/admin/media"
              className="rounded-md border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              Curate Gallery
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
