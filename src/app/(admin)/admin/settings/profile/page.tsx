import { requireUser, hasCapability } from "@/features/auth/authorization";
import { getOwnProfile } from "@/features/membership/queries";
import { ProfileEditor } from "@/features/membership/components/profile-editor";
import { AdminSettingsNav } from "@/features/admin/components/admin-settings-nav";

export const metadata = {
  title: "Admin Profile",
  description: "Manage your administrator contact details and profile preferences.",
};

export default async function AdminProfilePage() {
  const user = await requireUser("/admin/settings/profile");
  const profile = await getOwnProfile();
  const canManageSettings = await hasCapability("settings.manage", user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Administrator Workspace
        </span>
        <h1 className="font-serif text-3xl font-bold text-foreground">Admin Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your administrator contact details, personal address, and directory preferences
          without switching away from the admin dashboard.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <AdminSettingsNav activeTab="profile" canManageSettings={canManageSettings} />

      {/* Profile Editor Card */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-sm space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">
            Personal &amp; Operator Details
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your personal record stored securely in the SDGC database
          </p>
        </div>

        {profile ? (
          <ProfileEditor initialProfile={profile} />
        ) : (
          <div className="rounded-xl border border-border/80 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            No profile record found for this administrator account. Please contact system support.
          </div>
        )}
      </div>
    </div>
  );
}
