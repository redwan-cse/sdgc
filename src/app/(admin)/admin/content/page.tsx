import { AdminContent } from "@/features/admin/components/admin-content";
import { getAdminPages } from "@/features/admin/queries";
import { getHomePageContent } from "@/features/content/queries";
import { requireCapability } from "@/features/auth/authorization";

export const metadata = {
  title: "Pages & Site Copy",
};

export default async function AdminContentPage() {
  await requireCapability("content.manage", "/admin/content");
  const [pages, homeContent] = await Promise.all([getAdminPages(), getHomePageContent()]);
  return <AdminContent initialPages={pages} initialHomeContent={homeContent} />;
}
