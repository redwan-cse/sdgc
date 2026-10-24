import { requireUser, hasCapability, getAssuranceLevel } from "@/features/auth/authorization";
import { AccountSecurity } from "@/features/membership/components/account-security";
import { AdminSettingsNav } from "@/features/admin/components/admin-settings-nav";

export const metadata = {
  title: "Admin Security & MFA",
  description: "Manage your administrator password and two-factor authentication credentials.",
};

export default async function AdminSecurityPage() {
  const user = await requireUser("/admin/settings/security");
  const canManageSettings = await hasCapability("settings.manage", user.id);
  const assurance = await getAssuranceLevel();

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

      {/* Security Level Recommendation for Admins */}
      {assurance.nextLevel !== "aal2" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <svg
              className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <span>Security Recommendation: Enable Two-Factor Authentication</span>
          </div>
          <p className="leading-relaxed">
            Your administrator account currently uses single-factor authentication (AAL1). We
            strongly recommend enabling TOTP below to elevate your account to Authenticator
            Assurance Level 2 (AAL2) and safeguard club operations.
          </p>
        </div>
      )}

      {/* Account Security Cards */}
      <div className="space-y-6">
        <AccountSecurity userEmail={user.email} />
      </div>
    </div>
  );
}
