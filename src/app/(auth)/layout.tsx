import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
