import type { Metadata } from "next";
import { getPublishedNotices } from "@/features/notices/queries";
import { NoticeBoard } from "@/features/notices/components/notice-board";
import { serializeJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Club Notice Board & Announcements | Saugatuck Douglas Garden Club",
  description:
    "Official bulletins, meeting schedules, frost advisories, volunteer opportunities, and community announcements from the Saugatuck Douglas Garden Club.",
};

export default async function NoticesPage() {
  const notices = await getPublishedNotices();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://saugatuckdouglasgardenclub.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Club Notice Board",
    description: "Official bulletins and community notices from Saugatuck Douglas Garden Club",
    url: `${siteUrl}/notices`,
    publisher: {
      "@type": "Organization",
      name: "Saugatuck Douglas Garden Club",
      url: siteUrl,
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is safely serialized
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      {/* Hero Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary uppercase tracking-wide">
          Community Bulletins &amp; Updates
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
          Club Notice Board
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Stay informed with current alerts, upcoming meeting programs, civic beautification
          schedules, and volunteer opportunities.
        </p>
      </div>

      <NoticeBoard initialNotices={notices} />
    </div>
  );
}
