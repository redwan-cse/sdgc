import type { Route } from "next";
import Link from "next/link";
import { FIXTURE_PAGES } from "../../../../tests/fixtures/public-content";

export const metadata = {
  title: "About Our Club",
  description:
    "Learn about the history, community beautification projects, scholarships, and garden recognition awards of Saugatuck Douglas Garden Club.",
};

export default function AboutPage() {
  const about = FIXTURE_PAGES.about;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Dedicated Since 1980
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">{about.title}</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">{about.subtitle}</p>
      </div>

      <div className="space-y-8">
        {about.sections.map((section) => (
          <article
            key={section.id}
            className="rounded-2xl border border-border bg-card p-8 sm:p-10 shadow-xs space-y-4"
          >
            <h2 className="font-serif text-2xl font-bold text-foreground">{section.heading}</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              {section.body.map((para, idx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed content paragraph
                <p key={idx}>{para}</p>
              ))}
            </div>

            {section.callToAction && (
              <div className="pt-4 border-t border-border">
                <Link
                  href={section.callToAction.href as Route}
                  className="rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors inline-block"
                >
                  {section.callToAction.label} &rarr;
                </Link>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
