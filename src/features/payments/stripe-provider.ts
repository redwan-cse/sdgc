import "server-only";

import crypto from "node:crypto";
import type { CreateCheckoutInput, CheckoutResult } from "./types";

export interface StripeConfigStatus {
  isConfigured: boolean;
  isTestMode: boolean;
  publishableKeyAvailable: boolean;
  secretKeyAvailable: boolean;
  webhookSecretAvailable: boolean;
}

export class StripePaymentProvider {
  getConfigStatus(): StripeConfigStatus {
    const secretKey = process.env.STRIPE_SECRET_KEY || "";
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    const isTestMode = secretKey.startsWith("sk_test_") || publishableKey.startsWith("pk_test_");
    const isConfigured = Boolean(secretKey && publishableKey);

    return {
      isConfigured,
      isTestMode,
      publishableKeyAvailable: Boolean(publishableKey),
      secretKeyAvailable: Boolean(secretKey),
      webhookSecretAvailable: Boolean(webhookSecret),
    };
  }

  /**
   * Creates a sandbox Stripe Checkout session contract.
   * STRICT SECURITY CONSTRAINTS:
   * - Authoritative pricing: Amount is passed from server-verified database terms, never from client requests.
   * - Test mode only: Fails closed if live keys are detected during local development or testing.
   * - Return URLs never confirm payment or approve membership. Confirmation requires signed webhook verification.
   */
  async createCheckoutSession(
    input: CreateCheckoutInput & {
      termYear: number;
      userId: string;
      customerEmail?: string;
    },
  ): Promise<CheckoutResult> {
    const status = this.getConfigStatus();

    // Guard: Prevent live charges during testing
    if (process.env.NODE_ENV !== "production" && !status.isTestMode && status.isConfigured) {
      throw new Error(
        "CRITICAL SECURITY REJECTION: Live Stripe keys detected in development/test environment. Only sandbox/test keys (sk_test_*) are permitted.",
      );
    }

    if (!status.isConfigured) {
      // Return structured fallback contract when unconfigured
      const sessionRef = `cs_test_${crypto.randomBytes(12).toString("hex")}`;
      return {
        checkoutUrl: `${input.returnPath}?session_id=${sessionRef}&provider=stripe_sandbox_unconfigured`,
        providerReference: sessionRef,
      };
    }

    const sessionRef = `cs_test_${crypto.randomBytes(12).toString("hex")}`;
    // Local simulation contract: returns visibly simulated path rather than fake checkout.stripe.com
    const checkoutUrl = `${input.returnPath}?session_id=${sessionRef}&provider=stripe_simulated`;

    return {
      checkoutUrl,
      providerReference: sessionRef,
    };
  }

  /**
   * Validates Stripe webhook signatures.
   * In sandbox testing, verifies HMAC-SHA256 signature when secret is available.
   * Strictly fails closed if STRIPE_WEBHOOK_SECRET is not configured or signature is invalid.
   */
  verifyWebhookSignature(payload: string, signatureHeader: string | null): boolean {
    if (!signatureHeader?.includes("t=") || !signatureHeader.includes("v1=")) {
      return false;
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      // Strictly fail closed if STRIPE_WEBHOOK_SECRET is not configured
      return false;
    }

    try {
      // Extract timestamp and signature components (t=...,v1=...)
      const parts = signatureHeader.split(",");
      const timestampPart = parts.find((p) => p.startsWith("t="));
      const sigPart = parts.find((p) => p.startsWith("v1="));

      if (!timestampPart || !sigPart) return false;

      const timestamp = timestampPart.slice(2);
      const expectedSig = sigPart.slice(3);

      const signedPayload = `${timestamp}.${payload}`;
      const computedSig = crypto
        .createHmac("sha256", webhookSecret)
        .update(signedPayload, "utf8")
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(computedSig, "hex"),
        Buffer.from(expectedSig, "hex"),
      );
    } catch {
      return false;
    }
  }
}

export const stripePaymentProvider = new StripePaymentProvider();
