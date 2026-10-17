import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAboutPageContent } from "@/features/content/queries";

export const metadata = {
  title: "About Our Club",
  description:
    "Learn about the history, community beautification projects, scholarships, and garden recognition awards of Saugatuck Douglas Garden Club.",
};

export default async function AboutPage() {
  const about = await getAboutPageContent();
  if (!about) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Dedicated Since 1980
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">{about.title}</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">{about.subtitle}</p>
      </div>

      <div className="space-y-10">
        {about.sections.map((section, idx) => {
          const isEven = idx % 2 === 1;
          return (
            <article
              key={section.id}
              className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-xs"
            >
              <div
                className={`flex flex-col ${section.image ? "lg:grid lg:grid-cols-12 lg:gap-8 items-center" : "space-y-4"}`}
              >
                <div
                  className={`${section.image ? `lg:col-span-7 space-y-4 ${isEven ? "lg:order-2" : "lg:order-1"}` : "space-y-4"}`}
                >
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                    {section.heading}
                  </h2>
                  <div className="space-y-3 text-muted-foreground leading-relaxed text-sm sm:text-base">
                    {section.body.map((para, pIdx) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: fixed content paragraph
                      <p key={pIdx}>{para}</p>
                    ))}
                  </div>

                  {section.callToAction && (
                    <div className="pt-4">
                      <Link
                        href={section.callToAction.href as Route}
                        className="rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors inline-block"
                      >
                        {section.callToAction.label} &rarr;
                      </Link>
                    </div>
                  )}
                </div>

                {section.image && (
                  <div
                    className={`mt-6 lg:mt-0 lg:col-span-5 w-full ${isEven ? "lg:order-1" : "lg:order-2"}`}
                  >
                    <div className="overflow-hidden rounded-xl border border-border shadow-xs aspect-4/3 relative">
                      <Image
                        src={section.image}
                        alt={section.imageAlt || section.heading}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 450px"
                      />
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
