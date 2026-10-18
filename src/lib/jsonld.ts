/**
 * Safely serializes data for injection into an inline <script type="application/ld+json"> tag.
 * Replaces '<' with unicode escape '\u003c' to prevent HTML script tag breakout (CWE-79 / XSS sink).
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export interface OrganizationSchemaInput {
  name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  facebookUrl?: string;
  instagramUrl?: string;
  motto?: string;
}

export function generateOrganizationSchema(contact: OrganizationSchemaInput) {
  const sameAs: string[] = [];
  if (contact.facebookUrl) sameAs.push(contact.facebookUrl);
  if (contact.instagramUrl) sameAs.push(contact.instagramUrl);

  return {
    "@context": "https://schema.org",
    "@type": "NGO",
    name: contact.name,
    legalName: contact.name,
    url: "https://saugatuckdouglasgardenclub.com",
    logo: "https://saugatuckdouglasgardenclub.com/images/brand/sdgc-logo.jpg",
    description:
      contact.motto ||
      "Dedicated to civic beautification, education, scholarships, and friendship since 1928 across Saugatuck and Douglas, Michigan.",
    foundingDate: "1928",
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.address,
      addressLocality: contact.city,
      addressRegion: contact.state,
      postalCode: contact.postalCode,
      addressCountry: "US",
    },
    telephone: contact.phone || undefined,
    email: contact.email || undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    nonprofitStatus: "Nonprofit501c3",
  };
}

export interface EventSchemaInput {
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string | null;
  venueName?: string;
  venueAddress?: string;
  featuredImage?: string | null;
  slug: string;
}

export function generateEventSchema(event: EventSchemaInput) {
  const url = `https://saugatuckdouglasgardenclub.com/event/${encodeURIComponent(event.slug)}`;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.startsAt,
    endDate: event.endsAt || event.startsAt,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url,
    image: event.featuredImage
      ? `https://saugatuckdouglasgardenclub.com${event.featuredImage}`
      : undefined,
    location: {
      "@type": "Place",
      name: event.venueName || "Saugatuck Douglas Garden Club",
      address: event.venueAddress
        ? {
            "@type": "PostalAddress",
            streetAddress: event.venueAddress,
            addressLocality: "Saugatuck",
            addressRegion: "MI",
            addressCountry: "US",
          }
        : undefined,
    },
    organizer: {
      "@type": "Organization",
      name: "Saugatuck Douglas Garden Club",
      url: "https://saugatuckdouglasgardenclub.com",
    },
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
