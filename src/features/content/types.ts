import type { EventSummary } from "@/features/events/types";

export interface PageContent {
  slug: string;
  title: string;
  subtitle?: string;
  heroImage?: string;
  event?: EventSummary;
  sections: {
    id: string;
    heading: string;
    body: string[];
    callToAction?: {
      label: string;
      href: string;
    };
    image?: string;
    imageAlt?: string;
  }[];
}
