import path from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error import-wordpress.mjs is an ES script without ambient typings
import { parseArgs, reconcileLegacyUserIdentity } from "../../scripts/import-wordpress.mjs";

describe("R1.7 & CLI: Import Argument and Identity Binding Verification", () => {
  describe("parseArgs flag validation", () => {
    it("accepts --input-dir and --input flags interchangeably", () => {
      const expectedPart = path.join("custom", "path");
      const parsedWithInputDir = parseArgs(["--input-dir", "custom/path"]);
      expect(parsedWithInputDir.inputDir).toContain(expectedPart);

      const parsedWithInput = parseArgs(["--input", "custom/path"]);
      expect(parsedWithInput.inputDir).toContain(expectedPart);

      const parsedWithInputDirEqual = parseArgs(["--input-dir=custom/path"]);
      expect(parsedWithInputDirEqual.inputDir).toContain(expectedPart);
    });

    it("rejects unknown CLI arguments", () => {
      expect(() => parseArgs(["--unknown-flag"])).toThrow(/unrecognized argument/i);
    });
  });

  describe("reconcileLegacyUserIdentity security verification", () => {
    it("rejects import when existing profile username matches but Auth email differs (takeover prevention)", () => {
      const existingProfile = { id: "user-123", username: "mary_gardener" };
      const existingAuthUser = { id: "user-123", email: "victim@sdgc.local" };
      const importedUser = { username: "mary_gardener", email: "attacker@evil.com" };

      const result = reconcileLegacyUserIdentity({
        existingProfile,
        existingAuthUser,
        importedUser,
      });

      expect(result.status).toBe("conflict");
      expect(result.targetUserId).toBeUndefined();
      expect(result.reason).toContain("Identity conflict for username");
    });

    it("rejects import when Auth email matches but existing profile has a different username", () => {
      const existingProfile = { id: "user-456", username: "john_doe" };
      const existingAuthUser = { id: "user-456", email: "member@sdgc.local" };
      const importedUser = { username: "other_user", email: "member@sdgc.local" };

      const result = reconcileLegacyUserIdentity({
        existingProfile,
        existingAuthUser,
        importedUser,
      });

      expect(result.status).toBe("conflict");
      expect(result.targetUserId).toBeUndefined();
      expect(result.reason).toContain("Identity conflict for email");
    });

    it("matches and returns targetUserId when both username and email reconcile", () => {
      const existingProfile = { id: "user-789", username: "jane_gardener" };
      const existingAuthUser = { id: "user-789", email: "jane@sdgc.local" };
      const importedUser = { username: "jane_gardener", email: "jane@sdgc.local" };

      const result = reconcileLegacyUserIdentity({
        existingProfile,
        existingAuthUser,
        importedUser,
      });

      expect(result.status).toBe("match");
      expect(result.targetUserId).toBe("user-789");
    });

    it("returns new when no existing profile or auth user exists", () => {
      const result = reconcileLegacyUserIdentity({
        existingProfile: null,
        existingAuthUser: null,
        importedUser: { username: "brand_new_member", email: "new@sdgc.local" },
      });

      expect(result.status).toBe("new");
    });
  });
});
