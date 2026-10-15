import Link from "next/link";
import Image from "next/image";
import { FIXTURE_PAGES, FIXTURE_MEDIA } from "../../../../tests/fixtures/public-content";

export const metadata = {
  title: "Annual Garden Walk",
  description:
    "Explore the 2026 Saugatuck Douglas Garden Walk: tour exquisite private gardens and support local community beautification and scholarships.",
};

export default function GardenWalkPage() {
  const walk = FIXTURE_PAGES.gardenWalk;
  const gardenPhotos = FIXTURE_MEDIA.slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary font-bold">
          Premier Lakeshore Horticultural Event
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">{walk.title}</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">{walk.subtitle}</p>
      </div>

      {/* Feature Walk Card */}
      <section className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-8 sm:p-12 shadow-sm space-y-8">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8">
          <div className="space-y-4 max-w-2xl">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              Saturday, July 11, 2026 &bull; 10:00 AM – 4:00 PM
            </span>
            <h2 className="font-serif text-3xl font-bold text-foreground">
              2026 Garden Walk Fundraiser Tour
            </h2>
            <div className="space-y-3 text-muted-foreground text-sm sm:text-base leading-relaxed">
              <p>
                Join garden lovers from throughout southwest Michigan and beyond for our signature
                self-guided tour of six exceptional private garden retreats in Saugatuck and
                Douglas.
              </p>
              <p>
                From blooming historic cottage perennials and native pollinator sanctuaries to
                peaceful woodland trails and creative waterscapes, this year&apos;s tour features
                inspiring horticultural variety.
              </p>
              <p className="font-medium text-foreground">
                Advance tickets: $20 &bull; Day of tour: $25. All proceeds fund club civic
                beautification projects and student scholarships.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row lg:flex-col shrink-0">
            <Link
              href="/event/2026-garden-walk-fundraiser"
              className="rounded-xl bg-primary px-8 py-4 text-center font-serif text-lg font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              Get Garden Walk Tickets &rarr;
            </Link>
            <Link
              href="/event/2026-garden-walk-fundraiser"
              className="rounded-xl border border-border bg-card px-8 py-3 text-center text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Tour Route & Details
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights Gallery Preview */}
      <section className="space-y-6">
        <div className="flex justify-between items-baseline">
          <h2 className="font-serif text-2xl font-bold text-foreground">
            Moments from Past Garden Walks
          </h2>
          <Link href="/gallery" className="text-sm font-semibold text-primary hover:underline">
            View Complete Gallery &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {gardenPhotos.map((photo) => (
            <div
              key={photo.id}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-xs group"
            >
              <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={600}
                  height={450}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <p className="p-3 text-xs text-muted-foreground">{photo.caption}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
