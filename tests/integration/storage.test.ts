import { describe, expect, it } from "vitest";
import { createAnonClient, createAuthClient } from "./setup";

describe("Supabase Storage RLS and Bucket Security Tests", () => {
  const anonClient = createAnonClient();

  describe("Public vs Private Media Object Access", () => {
    it("allows reading public objects in club-media bucket", async () => {
      const { data, error } = await anonClient.storage
        .from("club-media")
        .download("public/sample-image.txt");

      expect(error).toBeNull();
      expect(data).toBeDefined();
      if (data) {
        const text = await data.text();
        expect(text).toContain("Public sample test image data");
      }
    });

    it("denies anonymous access to private objects in club-media bucket", async () => {
      const { data, error } = await anonClient.storage
        .from("club-media")
        .download("private/sample-doc.txt");

      // Anonymous should be denied reading private storage objects
      expect(error).not.toBeNull();
      expect(data).toBeNull();
    });

    it("denies regular member from uploading to public media directory", async () => {
      const { client } = await createAuthClient("member@sdgc.local");

      const fileData = Buffer.from("Unauthorized member upload attempt");
      const { data, error } = await client.storage
        .from("club-media")
        .upload("public/unauthorized-file.txt", fileData, { upsert: false });

      // Regular members do not have media.manage capability, so upload must be denied
      expect(error).not.toBeNull();
      expect(data).toBeNull();
    });

    it("allows editor with media.manage capability to upload media", async () => {
      const { client } = await createAuthClient("editor@sdgc.local");

      const fileData = Buffer.from("Authorized editor test upload");
      const testFileName = `public/editor-test-${Date.now()}.txt`;

      const { data, error } = await client.storage
        .from("club-media")
        .upload(testFileName, fileData, {
          upsert: true,
          contentType: "text/plain",
        });

      expect(error).toBeNull();
      expect(data?.path).toBe(testFileName);

      // Verify the uploaded file can now be read
      const { data: readData, error: readError } = await anonClient.storage
        .from("club-media")
        .download(testFileName);

      expect(readError).toBeNull();
      expect(await readData?.text()).toBe("Authorized editor test upload");
    });
  });
});
