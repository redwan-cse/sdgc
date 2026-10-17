"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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
  const [mounted, setMounted] = React.useState(false);
  const lastPathname = React.useRef(pathname);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      id="mobile-navigation"
      role="dialog"
      aria-modal="true"
      aria-label="Site Navigation"
      ref={navRef}
      className="fixed inset-0 z-[100] flex flex-col bg-background text-foreground px-6 py-6 md:hidden overflow-y-auto"
    >
      <div className="flex items-center justify-between pb-6 border-b border-border shrink-0">
        <span className="font-serif text-xl font-bold text-primary">SDGC Navigation</span>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => {
              onClose();
              toggleRef.current?.focus();
            }}
            className="rounded-md p-2 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
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
      </div>

      <nav className="flex flex-col space-y-2 pt-6" aria-label="Mobile Main Navigation">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href as Route}
              onClick={onClose}
              className={`text-lg font-medium transition-colors py-3 px-4 rounded-lg ${
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

      <div className="mt-8 border-t border-border pt-6 flex flex-col space-y-2 pb-6">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-4 pb-1">
          Member & Admin Area
        </span>
        {authLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href as Route}
            onClick={onClose}
            className="text-base font-medium text-foreground py-2.5 px-4 rounded-lg hover:bg-muted transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>,
    document.body,
  );
}
