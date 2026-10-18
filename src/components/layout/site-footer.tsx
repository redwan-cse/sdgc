import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center space-x-3 mb-4">
              <Image
                src="/images/brand/sdgc-logo.jpg"
                alt="Saugatuck Douglas Garden Club logo"
                width={48}
                height={48}
                className="h-10 w-10 rounded-full object-cover"
              />
              <span className="font-serif text-lg font-bold text-primary">{siteConfig.name}</span>
            </Link>
            <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
              Dedicated to civic beautification, horticultural education, youth outreach, and
              friendship across Saugatuck and Douglas, Michigan.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Official Mailing Address: P.O. Box 1011, Douglas, MI 49406
            </p>
            <div className="mt-4 flex items-center space-x-4">
              <a
                href="https://www.facebook.com/profile.php?id=100064728277239"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-sm text-primary hover:underline font-medium"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
                <span>Follow on Facebook</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Explore
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About Our Club
                </Link>
              </li>
              <li>
                <Link href="/garden-walk" className="hover:text-foreground transition-colors">
                  Annual Garden Walk
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-foreground transition-colors">
                  Club Events Calendar
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-foreground transition-colors">
                  Photo Gallery
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Membership
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/join" className="hover:text-foreground transition-colors">
                  Become A Member
                </Link>
              </li>
              <li>
                <Link href="/membership" className="hover:text-foreground transition-colors">
                  Annual Dues ($50)
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  Member Login
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-foreground transition-colors">
                  Member Profile
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Connect
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-foreground transition-colors">
                  Meeting Schedule
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="hover:text-foreground transition-colors text-xs text-muted-foreground/80"
                >
                  Staff Administration
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center sm:flex sm:justify-between sm:text-left">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} Saugatuck Douglas Garden Club. All rights reserved. Registered
            501(c)(3) nonprofit organization.
          </p>
          <p className="mt-2 text-xs text-muted-foreground sm:mt-0">
            Saugatuck & Douglas, Allegan County, Michigan
          </p>
        </div>
      </div>
    </footer>
  );
}
