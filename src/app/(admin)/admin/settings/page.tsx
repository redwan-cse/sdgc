import { AdminSettings } from "@/features/admin/components/admin-settings";
import { AdminSettingsNav } from "@/features/admin/components/admin-settings-nav";
import { getSiteContactSettings } from "@/features/content/queries";
import { requireCapability } from "@/features/auth/authorization";

export const metadata = {
  title: "Site Settings & Contact Info",
};

export default async function AdminSettingsPage() {
  await requireCapability("settings.manage", "/admin/settings");
  const settings = await getSiteContactSettings();
  return (
    <div className="space-y-6">
      <AdminSettingsNav activeTab="settings" canManageSettings={true} />
      <AdminSettings initialSettings={settings} />
    </div>
  );
}
