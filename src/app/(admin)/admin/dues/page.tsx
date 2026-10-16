import { AdminDues } from "@/features/admin/components/admin-dues";
import { getAdminDuesRecords } from "@/features/admin/queries";
import { requireCapability } from "@/features/auth/authorization";

export const metadata = {
  title: "Dues & Financial Reconciliation",
};

export default async function AdminDuesPage() {
  await requireCapability("dues.reconcile", "/admin/dues");
  const records = await getAdminDuesRecords();
  return <AdminDues initialRecords={records} />;
}
