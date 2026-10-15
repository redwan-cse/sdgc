import type { MemberProfile } from "@/features/membership/types";

export type AppRole = "admin" | "editor" | "treasurer";

export type Capability =
  | "read_public"
  | "manage_own_profile"
  | "view_member_resources"
  | "manage_content"
  | "reconcile_dues"
  | "manage_club";

export interface AuthSessionUser {
  id: string;
  email: string;
  username: string;
  roles: AppRole[];
  capabilities: Capability[];
  profile?: MemberProfile;
}
