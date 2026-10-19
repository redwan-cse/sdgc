import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlbumDetailView } from "@/features/media/components/album-detail-view";
import { getAlbumBySlug } from "@/features/media/queries";
import { serializeJsonLd } from "@/lib/jsonld";

interface AlbumDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: AlbumDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);

  if (!album) {
    return {
      title: "Album Not Found",
      description: "The requested photo album could not be found in the SDGC archive.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://saugatuckdouglasgardenclub.com";
  const albumUrl = `${siteUrl}/gallery/${album.slug}`;
  const ogImages = album.coverImage?.src ? [{ url: album.coverImage.src }] : [];

  return {
    title: `${album.title} | Photo Album`,
    description:
      album.description ||
      `Explore photographs and moments from ${album.title} in the Saugatuck-Douglas Garden Club gallery.`,
    alternates: {
      canonical: albumUrl,
    },
    openGraph: {
      title: `${album.title} | SDGC Photo Album`,
      description:
        album.description ||
        `Explore photographs and moments from ${album.title} in the Saugatuck-Douglas Garden Club gallery.`,
      url: albumUrl,
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: album.title,
      description: album.description || "Browse photo moments from SDGC.",
      images: ogImages.map((i) => i.url),
    },
  };
}

export default async function AlbumDetailPage({ params }: AlbumDetailPageProps) {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);

  if (!album) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://saugatuckdouglasgardenclub.com";
  const albumUrl = `${siteUrl}/gallery/${album.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: album.title,
    description: album.description,
    url: albumUrl,
    creator: {
      "@type": "Organization",
      name: "Saugatuck-Douglas Garden Club",
      url: siteUrl,
    },
    image: album.items.map((item) => ({
      "@type": "ImageObject",
      contentUrl: item.src,
      caption: item.caption || item.alt,
      name: item.alt,
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is safely serialized
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <AlbumDetailView album={album} />
    </div>
  );
}
