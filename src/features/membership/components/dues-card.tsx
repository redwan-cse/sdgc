"use client";

import * as React from "react";
import type { MembershipSummary } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DuesCardProps {
  membership: MembershipSummary;
}

export function DuesCard({ membership }: DuesCardProps) {
  const [selectedMethod, setSelectedMethod] = React.useState<"credit_card" | "check">(
    "credit_card",
  );
  const [paymentActionMessage, setPaymentActionMessage] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      await new Promise((res) => setTimeout(res, 400));
      if (selectedMethod === "credit_card") {
        setPaymentActionMessage(
          "Payment Simulation: Card payment of $50.00 recorded as CONFIRMED. As required by club bylaws, your membership is now PENDING manual approval by the treasurer/admin.",
        );
      } else {
        setPaymentActionMessage(
          "Check Instructions: Please mail your $50.00 check payable to 'SDGC' to P.O. Box 1011, Douglas, MI 49406. Staff will reconcile your check upon receipt and activate your membership.",
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Status Overview Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Membership Term
            </span>
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Calendar Year {membership.year}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Term duration: January 1, {membership.year} – December 31, {membership.year}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {membership.isActive ? (
              <Badge variant="success">Active Member</Badge>
            ) : membership.isApproved ? (
              <Badge variant="default">Approved</Badge>
            ) : membership.paymentStatus === "confirmed" ? (
              <Badge variant="warning">Payment Confirmed &bull; Pending Staff Approval</Badge>
            ) : (
              <Badge variant="outline">Payment Pending</Badge>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="rounded-lg bg-muted/40 p-3 border border-border">
            <span className="text-xs text-muted-foreground block">Annual Dues Rate</span>
            <span className="text-lg font-bold text-foreground">
              ${(membership.duesCents / 100).toFixed(2)} {membership.currency}
            </span>
          </div>

          <div className="rounded-lg bg-muted/40 p-3 border border-border">
            <span className="text-xs text-muted-foreground block">Payment Status</span>
            <span className="text-lg font-bold capitalize text-foreground">
              {membership.paymentStatus}
            </span>
          </div>

          <div className="rounded-lg bg-muted/40 p-3 border border-border">
            <span className="text-xs text-muted-foreground block">Approval Decision</span>
            <span className="text-lg font-bold text-foreground">
              {membership.isApproved ? "Approved by Staff" : "Awaiting Verification"}
            </span>
          </div>
        </div>
      </div>

      {paymentActionMessage && (
        <div
          className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground space-y-1"
          role="status"
        >
          <p className="font-semibold text-primary">Transaction Notice</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{paymentActionMessage}</p>
        </div>
      )}

      {/* Payment Selection and Dues Payment */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-6">
        <div>
          <h3 className="font-serif text-xl font-bold text-foreground">Dues Payment Options</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Choose your preferred payment method. Saugatuck Douglas Garden Club does NOT support
            automatic recurring renewals. Dues must be renewed annually.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSelectedMethod("credit_card")}
            className={`rounded-xl border p-4 text-left transition-colors cursor-pointer ${
              selectedMethod === "credit_card"
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-foreground text-sm">
                Online Credit / Debit Card
              </span>
              <span className="text-xs font-bold text-primary">$50.00</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Instant electronic payment record. Requires subsequent manual staff review for
              activation.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod("check")}
            className={`rounded-xl border p-4 text-left transition-colors cursor-pointer ${
              selectedMethod === "check"
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-foreground text-sm">Mail-In Paper Check</span>
              <span className="text-xs font-bold text-primary">$50.00</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Payable to SDGC, P.O. Box 1011, Douglas, MI 49406. Activated once check clears.
            </p>
          </button>
        </div>

        {selectedMethod === "check" ? (
          <div className="rounded-lg bg-muted/50 p-4 border border-border text-xs text-foreground space-y-2">
            <p className="font-semibold text-sm">Mailing Instructions for Check Payment:</p>
            <p>
              1. Make check payable to:{" "}
              <span className="font-bold">Saugatuck Douglas Garden Club (SDGC)</span>
            </p>
            <p>
              2. Amount: <span className="font-bold">$50.00 USD</span>
            </p>
            <p>3. Memo line: Write your username or full name</p>
            <p>
              4. Mail to: <span className="font-bold">SDGC, P.O. Box 1011, Douglas, MI 49406</span>
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-muted/30 p-4 border border-border text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Online Card Payment Notice:</p>
            <p>
              In local development mode, a server-gated test adapter simulates the payment flow.
              Live payment provider integration connects when production merchant credentials are
              provided.
            </p>
          </div>
        )}

        <Button
          type="button"
          onClick={handlePay}
          disabled={isProcessing}
          size="lg"
          className="w-full sm:w-auto"
        >
          {isProcessing
            ? "Processing..."
            : selectedMethod === "credit_card"
              ? "Pay $50.00 Dues Online"
              : "Confirm Check Mailing Plan"}
        </Button>
      </div>
    </div>
  );
}
