export interface PageContent {
  slug: string;
  title: string;
  subtitle?: string;
  heroImage?: string;
  sections: {
    id: string;
    heading: string;
    body: string[];
    callToAction?: {
      label: string;
      href: string;
    };
  }[];
}
