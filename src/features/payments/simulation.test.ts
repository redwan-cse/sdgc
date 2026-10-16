import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { LocalSimulatedPaymentProvider } from "./local-provider";

describe("R1.6: Payment Simulation Boundary Enforcement", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("fails closed when Supabase target URL is a remote or hosted host", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example-project.supabase.co";
    process.env.LOCAL_PAYMENTS_SIMULATION = "true";
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";

    const provider = new LocalSimulatedPaymentProvider();
    await expect(
      provider.createCheckout({
        paymentId: "11111111-1111-1111-1111-111111111111",
        currency: "USD",
        amountCents: 5000,
        returnPath: "/profile",
      }),
    ).rejects.toThrow(/loopback/i);
  });

  it("fails closed in production if copied client flag NEXT_PUBLIC_LOCAL_PAYMENTS_ENABLED is present", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.LOCAL_PAYMENTS_SIMULATION;
    process.env.NEXT_PUBLIC_LOCAL_PAYMENTS_ENABLED = "true";

    const provider = new LocalSimulatedPaymentProvider();
    await expect(
      provider.createCheckout({
        paymentId: "11111111-1111-1111-1111-111111111111",
        currency: "USD",
        amountCents: 5000,
        returnPath: "/profile",
      }),
    ).rejects.toThrow(/Simulated payment provider (cannot be used in production|is disabled)/i);
  });

  it("fails closed in production even with LOCAL_PAYMENTS_SIMULATION unless explicit local-build flag is set", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.LOCAL_PAYMENTS_SIMULATION = "true";
    delete process.env.ALLOW_LOCAL_PRODUCTION_BUILD_TESTING;

    const provider = new LocalSimulatedPaymentProvider();
    await expect(
      provider.createCheckout({
        paymentId: "11111111-1111-1111-1111-111111111111",
        currency: "USD",
        amountCents: 5000,
        returnPath: "/profile",
      }),
    ).rejects.toThrow(/Simulated payment provider cannot be used in production/i);
  });

  it("permits local loopback simulation in production only with explicit ALLOW_LOCAL_PRODUCTION_BUILD_TESTING flag", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.LOCAL_PAYMENTS_SIMULATION = "true";
    process.env.ALLOW_LOCAL_PRODUCTION_BUILD_TESTING = "true";

    const provider = new LocalSimulatedPaymentProvider();
    const result = await provider.createCheckout({
      paymentId: "11111111-1111-1111-1111-111111111111",
      currency: "USD",
      amountCents: 5000,
      returnPath: "/profile",
    });

    expect(result.providerReference).toMatch(/^sim_tx_/);
    expect(result.checkoutUrl).toContain("simulated=true");
  });
});
