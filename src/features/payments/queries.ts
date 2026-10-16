import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/authorization";
import type { PaymentRecord } from "./types";

export interface DuesTermInfo {
  id: string;
  year: number;
  duesCents: number;
  currency: string;
  opensAt: string;
  closesAt: string;
}

export async function getCurrentTermInfo(): Promise<DuesTermInfo | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("membership_terms")
    .select("id, year, dues_cents, currency, opens_at, closes_at")
    .eq("year", 2026)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    year: data.year,
    duesCents: data.dues_cents,
    currency: data.currency,
    opensAt: data.opens_at,
    closesAt: data.closes_at,
  };
}

export async function getRecentPaymentsForUser(): Promise<PaymentRecord[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!data) return [];
  return data.map((p) => ({
    id: p.id,
    userId: p.user_id,
    membershipId: p.membership_id,
    termId: p.term_id,
    amountCents: p.amount_cents,
    currency: p.currency,
    paymentMethod: p.payment_method as PaymentRecord["paymentMethod"],
    status: p.status as PaymentRecord["status"],
    provider: p.provider,
    providerTransactionId: p.provider_transaction_id,
    providerEventId: p.provider_event_id,
    reconciledBy: p.reconciled_by,
    reconciledAt: p.reconciled_at,
    notes: p.notes,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));
}
