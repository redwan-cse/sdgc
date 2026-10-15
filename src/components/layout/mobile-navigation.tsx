"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

interface NavLinkItem {
  href: Route | string;
  label: string;
}

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  links: NavLinkItem[];
  authLinks: NavLinkItem[];
  toggleRef: React.RefObject<HTMLButtonElement | null>;
}

export function MobileNavigation({
  isOpen,
  onClose,
  links,
  authLinks,
  toggleRef,
}: MobileNavigationProps) {
  const pathname = usePathname();
  const navRef = React.useRef<HTMLDivElement>(null);

  const lastPathname = React.useRef(pathname);

  // Close when pathname changes
  React.useEffect(() => {
    if (pathname !== lastPathname.current) {
      lastPathname.current = pathname;
      if (isOpen) {
        onClose();
      }
    }
  }, [pathname, isOpen, onClose]);

  // Trap focus and handle Escape
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        toggleRef.current?.focus();
        return;
      }

      if (e.key === "Tab" && navRef.current) {
        const focusableElements = navRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (!firstElement || !lastElement) return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    // Set initial focus to the first link inside menu
    const timeout = setTimeout(() => {
      const first = navRef.current?.querySelector<HTMLElement>("a, button");
      first?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      clearTimeout(timeout);
    };
  }, [isOpen, onClose, toggleRef]);

  if (!isOpen) return null;

  return (
    <div
      id="mobile-navigation"
      role="dialog"
      aria-modal="true"
      aria-label="Site Navigation"
      ref={navRef}
      className="fixed inset-0 z-50 flex flex-col bg-background/98 backdrop-blur-md px-6 py-6 md:hidden overflow-y-auto"
    >
      <div className="flex items-center justify-between pb-6 border-b border-border">
        <span className="font-serif text-xl font-bold text-primary">SDGC Navigation</span>
        <button
          type="button"
          onClick={() => {
            onClose();
            toggleRef.current?.focus();
          }}
          className="rounded-md p-2 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Close navigation menu"
        >
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
        </button>
      </div>

      <nav className="flex flex-col space-y-4 pt-6" aria-label="Mobile Main Navigation">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href as Route}
              className={`text-lg font-medium transition-colors py-2 px-3 rounded-md ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border pt-6 flex flex-col space-y-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Member & Admin Area
        </span>
        {authLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href as Route}
            className="text-base font-medium text-foreground py-2 px-3 rounded-md hover:bg-muted"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
