import "server-only";

import type { CreateCheckoutInput, CheckoutResult } from "./types";

/**
 * Local simulated payment provider for local development & automated test suites.
 * In accordance with project instructions and Work Package R1.6:
 * - This local test payment adapter is server-gated and strictly verified against loopback backends.
 * - Fails closed if the configured Supabase target is non-loopback (e.g. hosted/remote), even with copied flags.
 * - In production (NODE_ENV === 'production'), simulation is blocked unless explicitly running in local production-build
 *   test mode (ALLOW_LOCAL_PRODUCTION_BUILD_TESTING === 'true' AND LOCAL_PAYMENTS_SIMULATION === 'true' on loopback).
 * - Client-side NEXT_PUBLIC flags are never trusted as authorization for server-side simulated dues processing.
 * - Simulates payment intent generation for test flows while leaving membership approval strictly manual.
 */
export class LocalSimulatedPaymentProvider {
  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";

    let isLoopback = false;
    try {
      const parsed = new URL(supabaseUrl);
      const host = parsed.hostname.toLowerCase();
      isLoopback = host === "127.0.0.1" || host === "localhost" || host === "::1";
    } catch {
      isLoopback = false;
    }

    if (!isLoopback) {
      throw new Error(
        "Simulated payment provider requires a local loopback Supabase stack. Hosted or remote targets are strictly disallowed.",
      );
    }

    const isServerSimulationActive = process.env.LOCAL_PAYMENTS_SIMULATION === "true";

    if (!isServerSimulationActive) {
      throw new Error(
        "Simulated payment provider is disabled. Set LOCAL_PAYMENTS_SIMULATION=true on the server to enable local test simulation.",
      );
    }

    if (process.env.NODE_ENV === "production") {
      const isLocalProdBuildTesting = process.env.ALLOW_LOCAL_PRODUCTION_BUILD_TESTING === "true";
      if (!isLocalProdBuildTesting) {
        throw new Error(
          "Simulated payment provider cannot be used in production. Local production build testing requires explicit ALLOW_LOCAL_PRODUCTION_BUILD_TESTING=true.",
        );
      }
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
