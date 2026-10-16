import { AdminOverview } from "@/features/admin/components/admin-overview";
import { getAdminOverviewStats } from "@/features/admin/queries";

export const metadata = {
  title: "Dashboard Overview",
};

export default async function AdminPage() {
  const stats = await getAdminOverviewStats();
  return <AdminOverview metrics={stats} />;
}
