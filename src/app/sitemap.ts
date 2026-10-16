import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://saugatuckdouglasgardenclub.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/garden-walk`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/membership`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/join`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  try {
    const supabase = await createClient();

    const { data: events } = await supabase
      .from("events")
      .select("slug, updated_at")
      .eq("status", "published");

    const eventRoutes: MetadataRoute.Sitemap = (events || []).map((e) => ({
      url: `${baseUrl}/event/${e.slug}`,
      lastModified: e.updated_at ? new Date(e.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    const { data: pages } = await supabase
      .from("pages")
      .select("slug, updated_at")
      .eq("status", "published");

    const dynamicPageRoutes: MetadataRoute.Sitemap = (pages || [])
      .filter((p) => !staticRoutes.some((sr) => sr.url === `${baseUrl}/${p.slug}`))
      .map((p) => ({
        url: `${baseUrl}/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));

    return [...staticRoutes, ...eventRoutes, ...dynamicPageRoutes];
  } catch {
    return staticRoutes;
  }
}
