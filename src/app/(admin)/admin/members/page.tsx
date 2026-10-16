import { AdminMembers } from "@/features/admin/components/admin-members";
import { getAdminMembers } from "@/features/admin/queries";
import { requireCapability } from "@/features/auth/authorization";

export const metadata = {
  title: "Member Roster & Approvals",
};

export default async function AdminMembersPage() {
  await requireCapability(["members.manage", "memberships.approve"], "/admin/members");
  const members = await getAdminMembers();
  return <AdminMembers initialMembers={members} />;
}
