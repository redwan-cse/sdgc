import "server-only";

import type { CreateCheckoutInput, CheckoutResult } from "./types";

/**
 * Local simulated payment provider for local development & automated test suites.
 * In accordance with project instructions:
 * - This local test payment adapter is server-gated.
 * - It is strictly disabled in production (throws error if NODE_ENV === 'production' unless explicitly enabled).
 * - Visibly labeled as simulated in logs and notices.
 * - Simulates instant confirmation for credit card transactions while leaving membership pending.
 */
export class LocalSimulatedPaymentProvider {
  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    const isSimulationExplicitlyAllowed =
      process.env.LOCAL_PAYMENTS_SIMULATION === "true" ||
      process.env.NEXT_PUBLIC_LOCAL_PAYMENTS_ENABLED === "true";

    if (process.env.NODE_ENV === "production" && !isSimulationExplicitlyAllowed) {
      throw new Error("Simulated payment provider cannot be used in production.");
    }

    const providerReference = `sim_tx_${crypto.randomUUID()}`;
    const checkoutUrl = `${input.returnPath}?payment_ref=${providerReference}&simulated=true`;

    return {
      checkoutUrl,
      providerReference,
    };
  }
}

export const localPaymentProvider = new LocalSimulatedPaymentProvider();
