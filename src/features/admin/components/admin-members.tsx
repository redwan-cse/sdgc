"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MemberItem {
  id: string;
  username: string;
  name: string;
  email: string;
  year: number;
  paymentStatus: "confirmed" | "pending";
  isApproved: boolean;
  masterGardener: boolean;
  roles: string[];
}

const INITIAL_MEMBERS: MemberItem[] = [
  {
    id: "mem-1",
    username: "daisy_miller",
    name: "Daisy Miller",
    email: "daisy.miller@example.com",
    year: 2026,
    paymentStatus: "confirmed",
    isApproved: false,
    masterGardener: true,
    roles: ["member"],
  },
  {
    id: "mem-2",
    username: "george_harrison",
    name: "George Harrison",
    email: "george.h@example.com",
    year: 2026,
    paymentStatus: "confirmed",
    isApproved: true,
    masterGardener: false,
    roles: ["member", "editor"],
  },
  {
    id: "mem-3",
    username: "eleanor_rigby",
    name: "Eleanor Rigby",
    email: "eleanor.r@example.com",
    year: 2026,
    paymentStatus: "pending",
    isApproved: false,
    masterGardener: true,
    roles: ["member"],
  },
];

export function AdminMembers() {
  const [members, setMembers] = React.useState<MemberItem[]>(INITIAL_MEMBERS);
  const [filter, setFilter] = React.useState<string>("");
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);

  const handleApprove = (id: string, name: string) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, isApproved: true } : m)));
    setActionNotice(`Membership approved for ${name}. Notification recorded in audit log.`);
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(filter.toLowerCase()) ||
      m.username.toLowerCase().includes(filter.toLowerCase()) ||
      m.email.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Member Management & Approvals
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review member registrations, verify payment state, and issue manual annual approvals.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search members..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {actionNotice && (
        <div
          className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-600/30 p-3 text-xs text-emerald-800 dark:text-emerald-300"
          role="status"
        >
          {actionNotice}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4">Member Name</th>
                <th className="p-4">Username & Email</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Approval Status</th>
                <th className="p-4">Roles</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <span className="font-semibold text-foreground block">{member.name}</span>
                    {member.masterGardener && (
                      <span className="text-[11px] text-primary font-medium">Master Gardener</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-xs block text-foreground">
                      @{member.username}
                    </span>
                    <span className="text-xs text-muted-foreground">{member.email}</span>
                  </td>
                  <td className="p-4">
                    {member.paymentStatus === "confirmed" ? (
                      <Badge variant="success">Paid ($50)</Badge>
                    ) : (
                      <Badge variant="outline">Unpaid</Badge>
                    )}
                  </td>
                  <td className="p-4">
                    {member.isApproved ? (
                      <Badge variant="default">Active / Approved</Badge>
                    ) : (
                      <Badge variant="warning">Pending Approval</Badge>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {member.roles.map((r) => (
                        <span
                          key={r}
                          className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase font-semibold text-muted-foreground"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {!member.isApproved ? (
                      <Button size="sm" onClick={() => handleApprove(member.id, member.name)}>
                        Approve Membership
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Approved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
