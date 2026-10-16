"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { MobileNavigation } from "./mobile-navigation";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Our Club" },
  { href: "/garden-walk", label: "Garden Walk" },
  { href: "/events", label: "Events" },
  { href: "/gallery", label: "Gallery" },
  { href: "/join", label: "Become A Member" },
  { href: "/contact", label: "Contact Us" },
];

const AUTH_LINKS = [
  { href: "/login", label: "Member Login" },
  { href: "/membership", label: "Annual Dues" },
  { href: "/profile", label: "My Profile" },
  { href: "/admin", label: "Admin Panel" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const toggleRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center space-x-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Image
            src="/images/brand/sdgc-logo.jpg"
            alt="Saugatuck Douglas Garden Club logo"
            width={56}
            height={56}
            priority
            className="h-12 w-12 rounded-full object-cover shadow-xs border border-border"
          />
          <div className="flex flex-col">
            <span className="font-serif text-lg font-bold leading-tight text-primary sm:text-xl">
              Saugatuck Douglas
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Garden Club
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center space-x-1 lg:space-x-2"
          aria-label="Main Site Navigation"
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href as Route}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Member / Admin quick actions */}
        <div className="hidden lg:flex items-center space-x-2 border-l border-border pl-4">
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted border border-border"
          >
            Login
          </Link>
          <Link
            href="/join"
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 shadow-2xs"
          >
            Join
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            ref={toggleRef}
            type="button"
            data-hydrated={isMounted ? "true" : "false"}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-controls="mobile-navigation"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close main navigation menu" : "Open main navigation menu"}
          >
            {mobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <MobileNavigation
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        links={NAV_LINKS}
        authLinks={AUTH_LINKS}
        toggleRef={toggleRef}
      />
    </header>
  );
}
