import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNoticeBySlug } from "@/features/notices/queries";
import { NoticeDetail } from "@/features/notices/components/notice-detail";
import { serializeJsonLd } from "@/lib/jsonld";

interface NoticeSlugPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: NoticeSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const notice = await getNoticeBySlug(slug);

  if (!notice) {
    return {
      title: "Notice Not Found",
      description: "The requested club notice could not be found.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://saugatuckdouglasgardenclub.com";
  const url = `${siteUrl}/notices/${notice.slug}`;

  return {
    title: `${notice.title} | Club Notice`,
    description: notice.excerpt || `Notice from Saugatuck Douglas Garden Club: ${notice.title}`,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: notice.title,
      description: notice.excerpt || notice.title,
      url,
      type: "article",
      publishedTime: notice.publishedAt,
    },
  };
}

export default async function NoticeSlugPage({ params }: NoticeSlugPageProps) {
  const { slug } = await params;
  const notice = await getNoticeBySlug(slug);

  if (!notice) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://saugatuckdouglasgardenclub.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: notice.title,
    description: notice.excerpt || notice.title,
    datePublished: notice.publishedAt,
    dateModified: notice.updatedAt,
    url: `${siteUrl}/notices/${notice.slug}`,
    publisher: {
      "@type": "Organization",
      name: "Saugatuck Douglas Garden Club",
      url: siteUrl,
    },
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is safely serialized
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <NoticeDetail notice={notice} />
    </div>
  );
}
