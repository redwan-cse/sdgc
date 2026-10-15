"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DuesRecord {
  id: string;
  member: string;
  year: number;
  amount: number;
  method: "credit_card" | "check";
  status: "confirmed" | "pending_reconciliation";
  checkNumber?: string;
  date: string;
}

const INITIAL_DUES: DuesRecord[] = [
  {
    id: "pay-1",
    member: "Daisy Miller (@daisy_miller)",
    year: 2026,
    amount: 50.0,
    method: "credit_card",
    status: "confirmed",
    date: "2026-02-10",
  },
  {
    id: "pay-2",
    member: "Eleanor Rigby (@eleanor_rigby)",
    year: 2026,
    amount: 50.0,
    method: "check",
    status: "pending_reconciliation",
    checkNumber: "1042",
    date: "2026-02-14",
  },
];

export function AdminDues() {
  const [records, setRecords] = React.useState<DuesRecord[]>(INITIAL_DUES);
  const [notice, setNotice] = React.useState<string | null>(null);

  const handleReconcile = (id: string, member: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "confirmed" as const } : r)),
    );
    setNotice(`Check payment for ${member} has been reconciled and marked CONFIRMED.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Dues Reconciliation & Financials
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reconcile incoming paper checks and review electronic card dues records for calendar year
          2026.
        </p>
      </div>

      {notice && (
        <div
          className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-600/30 p-3 text-xs text-emerald-800 dark:text-emerald-300"
          role="status"
        >
          {notice}
        </div>
      )}

      {/* Current Term Configuration Banner */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Active Annual Dues Term
          </span>
          <p className="text-lg font-bold text-foreground">Calendar Year 2026 &bull; $50.00 USD</p>
          <p className="text-xs text-muted-foreground">
            Term valid: Jan 1, 2026 – Dec 31, 2026 &bull; Manual approval required for all
            activations
          </p>
        </div>
        <Badge variant="outline">Configured in Site Settings</Badge>
      </div>

      {/* Transactions Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border font-semibold text-sm">Dues Payment Journal</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4">Member</th>
                <th className="p-4">Year</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Method</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Reconciliation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-foreground">{r.member}</td>
                  <td className="p-4 text-muted-foreground">{r.year}</td>
                  <td className="p-4 font-semibold text-foreground">${r.amount.toFixed(2)}</td>
                  <td className="p-4">
                    <span className="capitalize">{r.method.replace("_", " ")}</span>
                    {r.checkNumber && (
                      <span className="block text-xs text-muted-foreground font-mono">
                        Check #{r.checkNumber}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {r.status === "confirmed" ? (
                      <Badge variant="success">Confirmed</Badge>
                    ) : (
                      <Badge variant="warning">Awaiting Staff Check Clearance</Badge>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {r.status === "pending_reconciliation" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleReconcile(r.id, r.member)}
                      >
                        Reconcile & Clear Check
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Reconciled</span>
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
