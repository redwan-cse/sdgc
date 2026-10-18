import { requireUser, hasCapability } from "@/features/auth/authorization";
import { AccountSecurity } from "@/features/membership/components/account-security";
import { AdminSettingsNav } from "@/features/admin/components/admin-settings-nav";

export const metadata = {
  title: "Admin Security & MFA",
  description: "Manage your administrator password and two-factor authentication credentials.",
};

export default async function AdminSecurityPage() {
  const user = await requireUser("/admin/settings/security");
  const canManageSettings = await hasCapability("settings.manage", user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Administrator Workspace
        </span>
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Admin Security &amp; Credentials
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your administrator login password and configure two-factor authentication (TOTP)
          directly within the admin portal.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <AdminSettingsNav activeTab="security" canManageSettings={canManageSettings} />

      {/* Account Security Cards */}
      <div className="space-y-6">
        <AccountSecurity userEmail={user.email} />
      </div>
    </div>
  );
}
