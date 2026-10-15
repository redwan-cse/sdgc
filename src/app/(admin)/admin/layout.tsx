import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AdminShell } from "@/features/admin/components/admin-shell";

export const metadata = {
  title: {
    template: "%s | SDGC Club Administration",
    default: "Admin Portal | SDGC",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <AdminShell>{children}</AdminShell>
      <SiteFooter />
    </div>
  );
}
