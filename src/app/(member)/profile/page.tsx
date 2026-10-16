import { getCurrentUser } from "@/features/auth/authorization";
import { getOwnProfile } from "@/features/membership/queries";
import { ProfileEditor } from "@/features/membership/components/profile-editor";

export const metadata = {
  title: "My Member Profile",
  description:
    "View and edit your personal member profile details and project volunteer preferences.",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const profile = user ? await getOwnProfile() : null;

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
