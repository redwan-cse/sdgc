import Link from "next/link";
import { getCurrentUser } from "@/features/auth/authorization";
import { getOwnProfile } from "@/features/membership/queries";
import { ProfileEditor } from "@/features/membership/components/profile-editor";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "My Member Profile",
  description:
    "View and edit your personal member profile details and project volunteer preferences.",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const profile = user ? await getOwnProfile() : null;

  let isStaff = false;
  let userRolesList: string[] = [];
  if (user) {
    const supabase = await createClient();
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    userRolesList = (userRoles || []).map((r) => r.role);
    isStaff = userRolesList.some((r) => ["admin", "editor", "treasurer"].includes(r));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Member Dashboard
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
          My Member Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep your contact information, address, and club project volunteer preferences up to date.
        </p>
      </div>

      {isStaff && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              <h2 className="font-semibold text-sm text-foreground">
                Administrative Privileges Active
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              You are signed in as an authorized club {userRolesList.join(" & ")}. Manage club
              rosters, dues, content, and events from the central administrative portal.
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 shadow-2xs"
          >
            Open Admin Dashboard &rarr;
          </Link>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-sm">
        {profile ? (
          <ProfileEditor initialProfile={profile} />
        ) : (
          <div className="text-center py-12 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Profile Not Found</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Unable to load your member profile. Please try refreshing the page or sign in again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
