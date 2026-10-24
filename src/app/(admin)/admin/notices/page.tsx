import type { Metadata } from "next";
import { requireCapability } from "@/features/auth/authorization";
import { getAllNoticesAdmin } from "@/features/notices/queries";
import { AdminNoticesManager } from "@/features/notices/components/admin-notices-manager";

export const metadata: Metadata = {
  title: "Notice Board Management | Admin Portal",
  description: "Manage official club announcements, frost warnings, and community bulletins.",
};

export default async function AdminNoticesPage() {
  await requireCapability("content.manage", "/admin/notices");
  const notices = await getAllNoticesAdmin();

  return <AdminNoticesManager initialNotices={notices} />;
}
