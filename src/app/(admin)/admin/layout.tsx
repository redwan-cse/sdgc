import { AdminShell } from "@/features/admin/components/admin-shell";
import { requireUser } from "@/features/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: {
    template: "%s | SDGC Club Administration",
    default: "Admin Portal | SDGC",
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/admin");
  const supabase = await createClient();

  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roles = (userRoles || []).map((r) => r.role);
  const isStaff = roles.some((r) => ["admin", "editor", "treasurer"].includes(r));
  if (!isStaff) {
    redirect("/profile?error=unauthorized");
  }

  const primaryRole = roles.includes("admin")
    ? "Administrator"
    : roles.includes("treasurer")
      ? "Treasurer"
      : roles.includes("editor")
        ? "Editor"
        : "Staff";

  return (
    <AdminShell activeRole={primaryRole} roles={roles} userEmail={user.email ?? ""}>
      {children}
    </AdminShell>
  );
}
