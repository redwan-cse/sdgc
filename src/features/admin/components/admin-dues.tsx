"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminDuesRecord, AdminTermRecord } from "../types";
import { reconcilePaymentAction, updateDuesRateAction } from "../actions";

interface AdminDuesProps {
  initialRecords: AdminDuesRecord[];
  initialTerms?: AdminTermRecord[];
  initialStatusFilter?: string;
}

function formatInclusiveTermDates(opensAt: string, closesAt: string): string {
  try {
    const start = new Date(opensAt);
    const end = new Date(closesAt);
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      timeZone: "America/Detroit",
    };
    const startStr = start.toLocaleDateString("en-US", options);
    const endStr = end.toLocaleDateString("en-US", {
      ...options,
      year: "numeric",
    });
    return `${startStr} – ${endStr}`;
  } catch {
    return `${opensAt.slice(0, 10)} to ${closesAt.slice(0, 10)}`;
  }
}

export function AdminDues({
  initialRecords,
  initialTerms = [],
  initialStatusFilter,
}: AdminDuesProps) {
  const [records, setRecords] = React.useState<AdminDuesRecord[]>(initialRecords);
  const [terms, setTerms] = React.useState<AdminTermRecord[]>(initialTerms);
  const [statusFilter, setStatusFilter] = React.useState<string>(initialStatusFilter || "all");
  const [notice, setNotice] = React.useState<string | null>(null);
  const [isError, setIsError] = React.useState(false);
  const [reconcilingId, setReconcilingId] = React.useState<string | null>(null);
  const [reconcileNotes, setReconcileNotes] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Term rate edit modal state
  const [editingTerm, setEditingTerm] = React.useState<AdminTermRecord | null>(null);
  const [editAmountDollars, setEditAmountDollars] = React.useState<string>("");

  React.useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  React.useEffect(() => {
    setTerms(initialTerms);
  }, [initialTerms]);

  const activeTerm =
    terms.length > 0 ? terms.find((t) => t.year === new Date().getFullYear()) || terms[0] : null;

  const handleOpenEditTerm = (term: AdminTermRecord) => {
    setEditingTerm(term);
    setEditAmountDollars((term.duesCents / 100).toFixed(2));
  };

  const handleSaveTermRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTerm) return;
    const parsedDollars = parseFloat(editAmountDollars);
    if (Number.isNaN(parsedDollars) || parsedDollars <= 0) {
      setIsError(true);
      setNotice("Please enter a valid dues amount.");
      return;
    }
    const cents = Math.round(parsedDollars * 100);

    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await updateDuesRateAction({
        year: editingTerm.year,
        duesCents: cents,
      });

      if (res.success) {
        setTerms((prev) =>
          prev.map((t) => (t.year === editingTerm.year ? { ...t, duesCents: cents } : t)),
        );
        setNotice(
          `Updated dues rate for term ${editingTerm.year} to $${parsedDollars.toFixed(2)}.`,
        );
        setEditingTerm(null);
      } else {
        setIsError(true);
        setNotice(`Failed to update dues rate: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const filteredRecords = React.useMemo(() => {
    return records.filter((r) => {
      if (statusFilter === "pending") return r.status === "pending";
      if (statusFilter === "confirmed") return r.status === "confirmed";
      if (statusFilter === "closed") return r.status === "failed" || r.status === "refunded";
      return true;
    });
  }, [records, statusFilter]);

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
          <p className="text-lg font-bold text-foreground">
            {activeTerm
              ? `Calendar Year ${activeTerm.year} • $${(activeTerm.duesCents / 100).toFixed(2)} USD`
              : "No active terms configured"}
          </p>
          <p className="text-xs text-muted-foreground">
            {activeTerm
              ? `Term active: ${formatInclusiveTermDates(activeTerm.opensAt, activeTerm.closesAt)}`
              : "Configure an annual membership term below."}
          </p>
        </div>
        {activeTerm && (
          <Button size="sm" variant="outline" onClick={() => handleOpenEditTerm(activeTerm)}>
            Edit Term Rate
          </Button>
        )}
      </div>

      {terms.length > 1 && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
            All Membership Terms
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {terms.map((t) => (
              <div
                key={t.year}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
              >
                <div>
                  <span className="font-semibold text-sm text-foreground">Year {t.year}</span>
                  <p className="text-xs text-muted-foreground">
                    ${(t.duesCents / 100).toFixed(2)} USD
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => handleOpenEditTerm(t)}
                >
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              Dues Payment Journal ({filteredRecords.length} records)
            </span>
            <span className="text-xs text-muted-foreground">
              (Pending: {records.filter((r) => r.status === "pending").length})
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground mr-1">Status:</span>
            {[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending" },
              { id: "confirmed", label: "Confirmed" },
              { id: "closed", label: "Closed" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === f.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
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
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground text-xs">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
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
                      ) : r.status === "failed" ? (
                        <Badge variant="destructive">Failed</Badge>
                      ) : r.status === "refunded" ? (
                        <Badge variant="outline">Refunded</Badge>
                      ) : (
                        <Badge variant="warning">Awaiting Clearance</Badge>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {r.status === "pending" ? (
                        r.paymentMethod === "check" ? (
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
                              Reconcile Check
                            </Button>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Online Processing
                          </span>
                        )
                      ) : r.status === "confirmed" ? (
                        <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                          Reconciled
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Closed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Term Rate Modal */}
      {editingTerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h2 className="font-serif text-xl font-bold text-foreground">
              Configure Dues Rate &bull; Year {editingTerm.year}
            </h2>
            <p className="text-xs text-muted-foreground">
              Update the annual membership fee and grace period. Rates apply to new membership
              applications and renewal dues.
            </p>

            <form onSubmit={handleSaveTermRate} className="space-y-4 pt-2">
              <div>
                <label
                  htmlFor="edit-dues-amount"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Annual Dues Amount ($ USD) *
                </label>
                <input
                  id="edit-dues-amount"
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={editAmountDollars}
                  onChange={(e) => setEditAmountDollars(e.target.value)}
                  className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingTerm(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  Save Dues Rate
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
