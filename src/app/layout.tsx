import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/lora";
import { siteConfig } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s | ${siteConfig.shortName}` },
  description: siteConfig.description,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script>
          {`try {
            var stored = localStorage.getItem('theme');
            var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
            if (stored === 'dark' || (!stored && supportDarkMode)) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          } catch (e) {}`}
        </script>
      </head>
      <body className="font-sans antialiased bg-background text-foreground transition-colors duration-150">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
