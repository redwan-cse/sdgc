import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function AdminOverview() {
  const stats = [
    { label: "Active Members (2026)", value: "48", href: "/admin/members" },
    { label: "Pending Approvals", value: "3", alert: true, href: "/admin/members" },
    { label: "Unreconciled Dues", value: "2", alert: true, href: "/admin/dues" },
    { label: "Upcoming Events", value: "4", href: "/admin/events" },
    { label: "Unread Messages", value: "1", alert: true, href: "/admin/messages" },
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href as Route}
            className="rounded-xl border border-border bg-card p-4 shadow-xs hover:border-primary/50 transition-colors"
          >
            <span className="text-xs text-muted-foreground block truncate">{stat.label}</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-foreground">{stat.value}</span>
              {stat.alert && <Badge variant="warning">Action Needed</Badge>}
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
