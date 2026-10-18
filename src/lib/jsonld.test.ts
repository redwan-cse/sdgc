import { describe, expect, it } from "vitest";
import {
  generateBreadcrumbSchema,
  generateEventSchema,
  generateOrganizationSchema,
  serializeJsonLd,
} from "./jsonld";

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

describe("Structured Data Schema Generators", () => {
  it("generates valid NGO Organization schema with contact details", () => {
    const schema = generateOrganizationSchema({
      name: "Saugatuck Douglas Garden Club",
      email: "info@saugatuckdouglasgardenclub.com",
      phone: "269-857-4148",
      address: "P.O. Box 1011",
      city: "Douglas",
      state: "MI",
      postalCode: "49406",
      facebookUrl: "https://www.facebook.com/profile.php?id=100064728277239",
      motto: "Flora beautification since 1928",
    });

    expect(schema["@type"]).toBe("NGO");
    expect(schema.name).toBe("Saugatuck Douglas Garden Club");
    expect(schema.telephone).toBe("269-857-4148");
    expect(schema.address.postalCode).toBe("49406");
    expect(schema.sameAs).toContain("https://www.facebook.com/profile.php?id=100064728277239");
    expect(schema.nonprofitStatus).toBe("Nonprofit501c3");
  });

  it("generates valid Event schema with dates and location", () => {
    const schema = generateEventSchema({
      title: "47th Annual Garden Walk",
      description: "Tour 6 exquisite private gardens",
      startsAt: "2027-07-17T14:00:00.000Z",
      endsAt: "2027-07-17T20:00:00.000Z",
      venueName: "Old School House",
      venueAddress: "130 Center St, Douglas, MI 49406",
      featuredImage: "/images/wordpress/DSC_2808-scaled-1.jpg",
      slug: "47th-annual-garden-walk",
    });

    expect(schema["@type"]).toBe("Event");
    expect(schema.name).toBe("47th Annual Garden Walk");
    expect(schema.startDate).toBe("2027-07-17T14:00:00.000Z");
    expect(schema.location.name).toBe("Old School House");
    expect(schema.image).toBe(
      "https://saugatuckdouglasgardenclub.com/images/wordpress/DSC_2808-scaled-1.jpg",
    );
  });

  it("generates valid BreadcrumbList schema", () => {
    const schema = generateBreadcrumbSchema([
      { name: "Home", url: "https://saugatuckdouglasgardenclub.com" },
      { name: "Events", url: "https://saugatuckdouglasgardenclub.com/events" },
      { name: "Garden Walk", url: "https://saugatuckdouglasgardenclub.com/event/garden-walk" },
    ]);

    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement).toHaveLength(3);
    expect(schema.itemListElement[0]?.position).toBe(1);
    expect(schema.itemListElement[2]?.name).toBe("Garden Walk");
  });
});
