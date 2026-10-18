import { AdminDues } from "@/features/admin/components/admin-dues";
import { getAdminDuesRecords, getAdminTerms } from "@/features/admin/queries";
import { requireCapability } from "@/features/auth/authorization";

export const metadata = {
  title: "Dues & Financial Reconciliation",
};

interface AdminDuesPageProps {
  searchParams?: Promise<{ status?: string }>;
}

export default async function AdminDuesPage({ searchParams }: AdminDuesPageProps) {
  await requireCapability("dues.reconcile", "/admin/dues");
  const params = await searchParams;
  const [records, terms] = await Promise.all([getAdminDuesRecords(), getAdminTerms()]);
  return (
    <AdminDues initialRecords={records} initialTerms={terms} initialStatusFilter={params?.status} />
  );
}
