"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminDuesRecord } from "../types";
import { reconcilePaymentAction } from "../actions";

interface AdminDuesProps {
  initialRecords: AdminDuesRecord[];
}

export function AdminDues({ initialRecords }: AdminDuesProps) {
  const [records, setRecords] = React.useState<AdminDuesRecord[]>(initialRecords);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [isError, setIsError] = React.useState(false);
  const [reconcilingId, setReconcilingId] = React.useState<string | null>(null);
  const [reconcileNotes, setReconcileNotes] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  const handleReconcile = async (id: string, member: string) => {
    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await reconcilePaymentAction({
        paymentId: id,
        notes: reconcileNotes.trim() || undefined,
      });

      if (res.success) {
        setRecords((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: "confirmed",
                  reconciledAt: new Date().toISOString(),
                  notes: reconcileNotes || r.notes,
                }
              : r,
          ),
        );
        setNotice(`Check payment for ${member} has been reconciled and marked CONFIRMED.`);
        setReconcilingId(null);
        setReconcileNotes("");
      } else {
        setIsError(true);
        setNotice(`Could not reconcile payment: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Dues Reconciliation & Financials
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reconcile incoming paper checks, audit electronic card payments, and track annual
          membership dues.
        </p>
      </div>

      {notice && (
        <div
          className={`rounded-lg p-3 text-xs border ${
            isError
              ? "bg-rose-50 dark:bg-rose-950/30 border-rose-600/30 text-rose-800 dark:text-rose-300"
              : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-600/30 text-emerald-800 dark:text-emerald-300"
          }`}
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
        <div className="p-4 border-b border-border font-semibold text-sm flex justify-between items-center">
          <span>Dues Payment Journal ({records.length} records)</span>
          <span className="text-xs text-muted-foreground">
            Pending: {records.filter((r) => r.status === "pending").length}
          </span>
        </div>
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
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground text-xs">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <span className="font-semibold text-foreground block">{r.memberName}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        @{r.memberUsername}
                      </span>
                      {r.notes && (
                        <span className="block text-[11px] text-muted-foreground/80 italic mt-0.5">
                          Note: {r.notes}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground">{r.year}</td>
                    <td className="p-4 font-semibold text-foreground">
                      ${(r.amountCents / 100).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span className="capitalize">{r.paymentMethod.replace("_", " ")}</span>
                    </td>
                    <td className="p-4">
                      {r.status === "confirmed" ? (
                        <Badge variant="success">Confirmed</Badge>
                      ) : (
                        <Badge variant="warning">Awaiting Clearance</Badge>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {r.status === "pending" ? (
                        reconcilingId === r.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="text"
                              placeholder="Check # or note..."
                              value={reconcileNotes}
                              onChange={(e) => setReconcileNotes(e.target.value)}
                              className="rounded border border-input bg-background px-2 py-1 text-xs text-foreground w-36"
                            />
                            <Button
                              size="sm"
                              disabled={isSubmitting}
                              onClick={() => handleReconcile(r.id, r.memberName)}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReconcilingId(null);
                                setReconcileNotes("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setReconcilingId(r.id)}
                          >
                            Reconcile Payment
                          </Button>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium">
                          Reconciled
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
