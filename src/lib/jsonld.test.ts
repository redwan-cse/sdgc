import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "./jsonld";

describe("JSON-LD HTML-Safe Serialization", () => {
  it("escapes script closing tags to prevent premature script element termination", () => {
    const maliciousPayload = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: "Spring Planting Workshop </script><script>alert('pwned')</script>",
      description: "Learn organic gardening <script src='https://evil.com/xss.js'></script>",
    };

    const serialized = serializeJsonLd(maliciousPayload);

    // Must not contain raw '<' character that could be interpreted as HTML tags
    expect(serialized).not.toContain("<script");
    expect(serialized).not.toContain("</script");
    expect(serialized).toContain("\\u003c/script");
    expect(serialized).toContain("\\u003cscript");

    // Standard JSON parsers must deserialize it back to original content accurately
    const parsed = JSON.parse(serialized);
    expect(parsed.name).toBe(maliciousPayload.name);
    expect(parsed.description).toBe(maliciousPayload.description);
  });

  it("preserves standard unicode and characters without corruption", () => {
    const normalPayload = {
      name: "Perennial Garden Tour & Tea — 2026",
      location: {
        name: "Douglas Historical Center, MI",
      },
    };

    const serialized = serializeJsonLd(normalPayload);
    expect(JSON.parse(serialized)).toEqual(normalPayload);
  });
});
