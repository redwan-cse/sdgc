import { MemberShell } from "@/features/membership/components/member-shell";
import { getCurrentUser } from "@/features/auth/authorization";
import { createClient } from "@/lib/supabase/server";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  let isStaff = false;
  if (user) {
    const supabase = await createClient();
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roles = (userRoles || []).map((r) => r.role);
    isStaff = roles.some((r) => ["admin", "editor", "treasurer"].includes(r));
  }

  return (
    <MemberShell userEmail={user?.email ?? undefined} isStaff={isStaff}>
      {children}
    </MemberShell>
  );
}
