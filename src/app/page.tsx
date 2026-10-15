import Image from "next/image";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <main id="main-content" className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <div className="w-full rounded-xl border bg-card p-8 shadow-sm sm:p-12">
        <Image
          src="/images/brand/sdgc-logo.jpg"
          alt="Saugatuck Douglas Garden Club logo"
          width={1340}
          height={1340}
          priority
          className="mb-8 h-32 w-32 rounded-md object-contain"
        />
        <p className="mb-3 text-sm font-medium tracking-wide text-muted-foreground">
          Growing together
        </p>
        <h1 className="font-serif text-4xl leading-tight text-primary sm:text-5xl">
          {siteConfig.name}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {siteConfig.description}
        </p>
        <p className="mt-8 border-t pt-6 text-sm text-muted-foreground">
          Development foundation. The club website is being prepared for its next chapter.
        </p>
      </div>
    </main>
  );
}
