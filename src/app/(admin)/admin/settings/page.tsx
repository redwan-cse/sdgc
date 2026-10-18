import { AdminSettings } from "@/features/admin/components/admin-settings";
import { getSiteContactSettings } from "@/features/content/queries";
import { requireCapability } from "@/features/auth/authorization";

export const metadata = {
  title: "Site Settings & Contact Info",
};

export default async function AdminSettingsPage() {
  await requireCapability(["settings.manage", "content.manage"], "/admin/settings");
  const settings = await getSiteContactSettings();
  return <AdminSettings initialSettings={settings} />;
}
