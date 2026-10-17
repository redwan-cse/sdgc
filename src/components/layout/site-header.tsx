"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { MobileNavigation } from "./mobile-navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";

import { createClient } from "@/lib/supabase/client";
import { logoutAction } from "@/features/auth/actions";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Our Club" },
  { href: "/garden-walk", label: "Garden Walk" },
  { href: "/events", label: "Events" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact Us" },
];

export interface SiteHeaderProps {
  initialUser?: {
    email: string;
    isStaff: boolean;
  } | null;
}

export function SiteHeader({ initialUser }: SiteHeaderProps = {}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<{
    email: string;
    isStaff: boolean;
  } | null>(initialUser ?? null);
  const toggleRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    setIsMounted(true);
    const supabase = createClient();

    // Check client session
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        const roles = (userRoles || []).map((r) => r.role);
        setCurrentUser({
          email: user.email || "",
          isStaff: roles.some((r) => ["admin", "editor", "treasurer"].includes(r)),
        });
      } else {
        setCurrentUser(null);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setCurrentUser(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const authLinks = currentUser
    ? currentUser.isStaff
      ? [
          { href: "/admin", label: "Admin Dashboard" },
          { href: "/profile", label: "My Profile" },
          { href: "/directory", label: "Directory" },
          { href: "/membership", label: "Annual Dues" },
        ]
      : [
          { href: "/profile", label: "My Profile" },
          { href: "/directory", label: "Directory" },
          { href: "/membership", label: "Annual Dues" },
        ]
    : [
        { href: "/login", label: "Member Login" },
        { href: "/join", label: "Become A Member" },
      ];

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
          <ThemeToggle />
          {currentUser ? (
            <div className="flex items-center space-x-2">
              {currentUser.isStaff && (
                <Link
                  href="/admin"
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 shadow-2xs transition-colors"
                >
                  Admin Dashboard
                </Link>
              )}
              <Link
                href="/profile"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted border border-border transition-colors"
              >
                My Profile
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted border border-border transition-colors"
              >
                Login
              </Link>
              <Link
                href="/join"
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 shadow-2xs transition-colors"
              >
                Become a Member
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button and theme toggle */}
        <div className="flex md:hidden items-center space-x-2">
          <ThemeToggle />
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
        authLinks={authLinks}
        toggleRef={toggleRef}
      />
    </header>
  );
}
