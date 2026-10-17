import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getHomePageContent } from "@/features/content/queries";
import { listUpcomingEvents } from "@/features/events/queries";
import { ContactForm } from "@/features/contact/components/contact-form";
import { formatEventDateTime } from "@/features/events/calendar";

export const metadata = {
  title: {
    absolute: siteConfig.name,
  },
  description: siteConfig.description,
};

export default async function HomePage() {
  const homeData = await getHomePageContent();
  if (!homeData) {
    notFound();
  }

  const upcomingEvents = await listUpcomingEvents(3);

  return (
    <div className="space-y-16 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-muted/40 p-8 sm:p-14 shadow-sm">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <Image
              src="/images/brand/sdgc-logo.jpg"
              alt="Saugatuck Douglas Garden Club logo"
              width={240}
              height={240}
              priority
              className="h-32 w-32 sm:h-40 sm:w-40 rounded-2xl object-cover shadow-sm border border-border shrink-0"
            />
            <div className="text-center lg:text-left space-y-4">
              <span className="inline-block rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                Growing Together Since 1980
              </span>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-primary">
                {homeData.title || siteConfig.name}
              </h1>
              <p className="max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
                {homeData.subtitle}
              </p>
              <div className="pt-2 flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4">
                <Link
                  href="/join"
                  className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                >
                  Become A Member &rarr;
                </Link>
                <Link
                  href="/garden-walk"
                  className="rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
                >
                  2026 Garden Walk
                </Link>
                <Link
                  href="/events"
                  className="rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
                >
                  Events Calendar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Structured Content Sections */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {homeData.sections.map((section) => (
            <div
              key={section.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-8 shadow-xs"
            >
              <div className="space-y-4">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                  {section.heading}
                </h2>
                <div className="space-y-3 text-muted-foreground leading-relaxed">
                  {section.body.map((para, idx) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed content paragraph
                    <p key={idx}>{para}</p>
                  ))}
                </div>
              </div>

              {section.callToAction && (
                <div className="mt-8 pt-4 border-t border-border">
                  <Link
                    href={section.callToAction.href as Route}
                    className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
                  >
                    {section.callToAction.label} &rarr;
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Featured Civic Programs Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-muted/30 p-8 sm:p-12 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="font-serif text-3xl font-bold text-foreground">
              Civic Projects & Community Impact
            </h2>
            <p className="text-sm text-muted-foreground">
              Our volunteer members dedicate hundreds of hours each year to keep Saugatuck and
              Douglas blooming.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-2xs space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                01
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                Community Beautification
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gardens at the Douglas Library, City Hall plazas, waterfront parks, and downtown
                decorative flower boxes.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-2xs space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                02
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">Annual Garden Walk</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Premier lakeshore tour of six extraordinary private sanctuaries, raising funds for
                scholarships and civic plantings.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-2xs space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                03
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                Youth Workshops & Grants
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                6th-grade gardening workshops, high school botanical scholarships, and community
                educational grants.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-2xs space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                04
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                Garden Recognition Awards
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Annual awards honoring outstanding residential and commercial landscaping across our
                communities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Preview */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-4 mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Club Calendar
            </span>
            <h2 className="font-serif text-3xl font-bold text-foreground">Upcoming Club Events</h2>
          </div>
          <Link href="/events" className="text-sm font-semibold text-primary hover:underline">
            View Full Calendar (List / Month / Day) &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {upcomingEvents.map((event) => (
            <article
              key={event.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-xs hover:border-primary/50 transition-colors"
            >
              <div className="space-y-3">
                <time
                  dateTime={event.startsAt}
                  className="text-xs font-semibold text-primary block"
                >
                  {formatEventDateTime(event.startsAt)}
                </time>
                <h3 className="font-serif text-xl font-bold text-foreground">
                  <Link href={`/event/${event.slug}`} className="hover:underline">
                    {event.title}
                  </Link>
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-3">{event.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-xs">
                <span className="text-muted-foreground truncate max-w-[160px]">
                  {event.venueName}
                </span>
                <Link
                  href={`/event/${event.slug}`}
                  className="font-medium text-primary hover:underline shrink-0"
                >
                  Details &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Shared Contact Form Anchor Section */}
      <section id="contact" className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Get In Touch
            </span>
            <h2 className="font-serif text-3xl font-bold text-foreground">
              Contact Saugatuck Douglas Garden Club
            </h2>
            <p className="text-sm text-muted-foreground">
              Have questions about becoming a member, Garden Walk tickets, or community garden
              projects? Send us a note below.
            </p>
          </div>

          <ContactForm />
        </div>
      </section>
    </div>
  );
}
