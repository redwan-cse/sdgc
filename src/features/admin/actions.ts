"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCapability } from "@/features/auth/authorization";
import type { Database, Json } from "@/types/database";
import { optimizeImage } from "@/lib/media/optimizer";
import { getStorageProvider } from "@/lib/storage/provider";
import {
  DEFAULT_HOMEPAGE_SECTIONS,
  DEFAULT_HOMEPAGE_STORY,
  DEFAULT_SITE_CONTACT,
  type SiteContactSettings,
} from "@/features/content/queries";
import type { HomePageStory, PageSection } from "@/features/content/types";
import type { ActionResult, AdminVenueRecord } from "./types";

export async function createVenueAction(input: {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  url?: string;
}): Promise<ActionResult<AdminVenueRecord>> {
  const user = await requireCapability("events.manage");
  const supabase = await createClient();

  if (!input.name?.trim()) {
    return { success: false, error: "Venue name is required" };
  }

  const { data, error } = await supabase
    .from("venues")
    .insert({
      name: input.name.trim(),
      address: input.address?.trim() || null,
      city: input.city?.trim() || "Saugatuck",
      state: input.state?.trim() || "MI",
      postal_code: input.postalCode?.trim() || "49453",
      url: input.url?.trim() || null,
    })
    .select("id, name, address, city, state, postal_code, url")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "venue.created",
    entity_type: "venue",
    entity_id: data.id,
    details: { name: input.name.trim(), city: input.city },
  });

  revalidatePath("/admin/events");
  revalidatePath("/events");
  return {
    success: true,
    message: "Venue created successfully",
    data: {
      id: data.id,
      name: data.name,
      address: data.address ?? undefined,
      city: data.city ?? undefined,
      state: data.state ?? undefined,
      postalCode: data.postal_code ?? undefined,
      url: data.url ?? undefined,
    },
  };
}

export async function createEventAction(input: {
  title: string;
  slug: string;
  startsAt: string;
  endsAt?: string;
  category?: string;
  status: "published" | "draft" | "cancelled";
  venueId?: string;
  description?: string;
  featuredImage?: string;
}): Promise<ActionResult> {
  const user = await requireCapability("events.manage");
  const supabase = await createClient();

  const endsAt =
    input.endsAt || new Date(new Date(input.startsAt).getTime() + 2 * 3600000).toISOString();
  const description = input.description || input.title;

  const { data, error } = await supabase
    .from("events")
    .insert({
      title: input.title,
      slug: input.slug,
      starts_at: input.startsAt,
      ends_at: endsAt,
      excerpt: input.category || null,
      category: input.category || null,
      status: input.status,
      venue_id: input.venueId || null,
      description,
      featured_image: input.featuredImage?.trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Audit event
  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "event.created",
    entity_type: "event",
    entity_id: data.id,
    details: { title: input.title, slug: input.slug, status: input.status },
  });

  revalidatePath("/events");
  revalidatePath("/admin/events");
  revalidatePath("/admin");
  return { success: true, message: "Event created successfully", data };
}

export async function approveMembershipAction(input: {
  membershipId: string;
  expectedVersion?: number;
  waiveDues?: boolean;
  waiverReason?: string;
}): Promise<ActionResult> {
  await requireCapability(["members.manage", "memberships.approve"]);
  const supabase = await createClient();

  // Call atomic PostgreSQL procedure
  const { data, error } = await supabase.rpc("approve_membership", {
    p_membership_id: input.membershipId,
    p_expected_version: input.expectedVersion,
    p_waive_dues: input.waiveDues ?? false,
    p_waiver_reason: input.waiverReason,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string; new_version?: number };
  if (!result.success) {
    return { success: false, error: result.error || "Approval failed" };
  }

  revalidatePath("/admin/members");
  revalidatePath("/admin");
  revalidatePath("/directory");
  return { success: true, message: "Membership approved successfully", data: result };
}

export async function reconcilePaymentAction(input: {
  paymentId: string;
  notes?: string;
}): Promise<ActionResult> {
  await requireCapability("dues.reconcile");
  const supabase = await createClient();

  // Call atomic PostgreSQL procedure
  const { data, error } = await supabase.rpc("reconcile_payment", {
    p_payment_id: input.paymentId,
    p_notes: input.notes,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string };
  if (!result.success) {
    return { success: false, error: result.error || "Reconciliation failed" };
  }

  revalidatePath("/admin/dues");
  revalidatePath("/admin");
  revalidatePath("/directory");
  return { success: true, message: "Payment reconciled and confirmed" };
}

export async function setUserRolesAction(input: {
  userId: string;
  roles: ("admin" | "editor" | "treasurer")[];
}): Promise<ActionResult> {
  await requireCapability("roles.manage");
  const supabase = await createClient();

  const VALID_ROLES = new Set(["admin", "editor", "treasurer"]);
  for (const r of input.roles) {
    if (!VALID_ROLES.has(r)) {
      return { success: false, error: `Invalid role code: ${r}` };
    }
  }

  // Check last-admin protection before updating
  if (!input.roles.includes("admin")) {
    const { count, error: countErr } = await supabase
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "admin")
      .neq("user_id", input.userId);

    if (countErr || (count !== null && count < 1)) {
      return { success: false, error: "Cannot remove the last administrator" };
    }
  }

  const { error: rpcError } = await supabase.rpc("set_user_roles", {
    p_target_user_id: input.userId,
    p_new_roles: input.roles,
  });

  if (rpcError) {
    return { success: false, error: rpcError.message };
  }

  revalidatePath("/admin/members");
  return { success: true, message: "User roles updated successfully" };
}

export async function deleteEventAction(id: string): Promise<ActionResult> {
  const user = await requireCapability("events.manage");
  const supabase = await createClient();

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "event.deleted",
    entity_type: "event",
    entity_id: id,
  });

  revalidatePath("/events");
  revalidatePath("/admin/events");
  revalidatePath("/admin");
  return { success: true, message: "Event removed successfully" };
}

export async function updatePageAction(
  slug: string,
  input: {
    title: string;
    subtitle?: string;
    content?: string;
    status: "published" | "draft";
  },
): Promise<ActionResult> {
  const user = await requireCapability("content.manage");
  const supabase = await createClient();

  const updateData: {
    title: string;
    meta_description: string | null;
    status: "published" | "draft";
    updated_at: string;
    content?: string;
  } = {
    title: input.title,
    meta_description: input.subtitle || null,
    status: input.status,
    updated_at: new Date().toISOString(),
  };

  if (input.content !== undefined) {
    updateData.content = input.content;
  }

  const { error } = await supabase.from("pages").update(updateData).eq("slug", slug);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "page.updated",
    entity_type: "page",
    entity_id: slug,
    details: input,
  });

  revalidatePath(`/`);
  revalidatePath(`/${slug}`);
  revalidatePath("/admin/content");
  return { success: true, message: "Page copy updated successfully" };
}

export async function updateMessageStatusAction(
  id: string,
  status: "unread" | "read" | "archived",
): Promise<ActionResult> {
  const user = await requireCapability("messages.manage");
  const supabase = await createClient();

  const { error } = await supabase
    .from("contact_messages")
    .update({
      status,
      triaged_by: user.id,
      triaged_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { success: true, message: "Message status updated" };
}

export async function updateEventAction(input: {
  id: string;
  title: string;
  slug: string;
  startsAt: string;
  endsAt?: string;
  category?: string;
  status: "published" | "draft" | "cancelled";
  description?: string;
  venueId?: string;
  venueName?: string;
  featuredImage?: string | null;
}): Promise<ActionResult> {
  const user = await requireCapability("events.manage");
  const supabase = await createClient();

  const endsAt =
    input.endsAt || new Date(new Date(input.startsAt).getTime() + 2 * 3600000).toISOString();

  let targetVenueId: string | null | undefined = input.venueId;
  if (targetVenueId === undefined && input.venueName) {
    const { data: matchedVenue } = await supabase
      .from("venues")
      .select("id")
      .ilike("name", input.venueName.trim())
      .limit(1)
      .maybeSingle();
    if (matchedVenue) {
      targetVenueId = matchedVenue.id;
    }
  }

  const updatePayload: Database["public"]["Tables"]["events"]["Update"] = {
    title: input.title,
    slug: input.slug,
    starts_at: input.startsAt,
    ends_at: endsAt,
    excerpt: input.category || null,
    category: input.category || null,
    status: input.status,
    description: input.description || input.title,
    updated_at: new Date().toISOString(),
  };

  if (targetVenueId !== undefined) {
    updatePayload.venue_id = targetVenueId;
  }

  if (input.featuredImage !== undefined) {
    updatePayload.featured_image = input.featuredImage?.trim() || null;
  }

  const { error } = await supabase.from("events").update(updatePayload).eq("id", input.id);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "event.updated",
    entity_type: "event",
    entity_id: input.id,
    details: input,
  });

  revalidatePath("/events");
  revalidatePath("/admin/events");
  revalidatePath("/admin");
  return { success: true, message: "Event updated successfully" };
}

export async function updateDuesRateAction(input: {
  year: number;
  duesCents: number;
}): Promise<ActionResult> {
  await requireCapability(["dues.reconcile", "members.manage"]);
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("update_dues_rate", {
    p_term_year: input.year,
    p_dues_cents: input.duesCents,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/dues");
  revalidatePath("/admin");
  revalidatePath("/membership");
  revalidatePath("/join");
  return { success: true, message: "Annual dues rate updated successfully", data };
}

export async function updateMembershipTermAction(input: {
  termId: string;
  duesCents?: number;
  opensAt?: string;
  closesAt?: string;
}): Promise<ActionResult> {
  await requireCapability(["dues.reconcile", "members.manage"]);
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("update_membership_term", {
    p_term_id: input.termId,
    p_dues_cents: input.duesCents,
    p_opens_at: input.opensAt,
    p_closes_at: input.closesAt,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/dues");
  revalidatePath("/admin");
  revalidatePath("/membership");
  revalidatePath("/join");
  return { success: true, message: "Membership term updated successfully", data };
}

export async function createMembershipTermAction(input: {
  year: number;
  duesCents: number;
  opensAt: string;
  closesAt: string;
  currency?: string;
}): Promise<ActionResult> {
  await requireCapability(["dues.reconcile", "members.manage"]);
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_membership_term", {
    p_year: input.year,
    p_dues_cents: input.duesCents,
    p_opens_at: input.opensAt,
    p_closes_at: input.closesAt,
    p_currency: input.currency ?? "USD",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/dues");
  revalidatePath("/admin");
  revalidatePath("/membership");
  revalidatePath("/join");
  return { success: true, message: "New membership term created successfully", data };
}

export async function adminUpdateMemberProfileAction(input: {
  userId: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  altPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  spouseFirstName?: string;
  isMasterGardener?: boolean;
  directoryOptOut?: boolean;
  gardeningInterests?: string;
  workExperience?: string;
  volunteerExperience?: string;
  notes?: string;
}): Promise<ActionResult> {
  await requireCapability("members.manage");
  const supabase = await createClient();

  let fName = input.firstName || "";
  let lName = input.lastName || "";
  if (!fName && !lName && input.fullName) {
    const parts = input.fullName.trim().split(/\s+/);
    fName = parts[0] || "";
    lName = parts.slice(1).join(" ") || "";
  }

  const { error } = await supabase.rpc("admin_update_member_profile", {
    target_user_id: input.userId,
    p_first_name: fName || undefined,
    p_last_name: lName || undefined,
    p_phone: input.phone || undefined,
    p_alt_phone: input.altPhone || undefined,
    p_address_line1: input.addressLine1 || undefined,
    p_address_line2: input.addressLine2 || undefined,
    p_city: input.city || undefined,
    p_state: input.state || undefined,
    p_postal_code: input.postalCode || undefined,
    p_spouse_first_name: input.spouseFirstName || undefined,
    p_is_master_gardener: input.isMasterGardener,
    p_directory_opt_out: input.directoryOptOut,
    p_gardening_interests: input.gardeningInterests || undefined,
    p_work_experience: input.workExperience || input.volunteerExperience || undefined,
    p_notes: input.notes || undefined,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/members");
  revalidatePath("/admin");
  revalidatePath("/directory");
  return { success: true, message: "Member profile updated successfully" };
}

export async function updateMediaAssetAction(input: {
  id: string;
  altText: string;
  caption?: string;
  isPublic?: boolean;
}): Promise<ActionResult> {
  const user = await requireCapability("media.manage");
  const supabase = await createClient();

  const { error } = await supabase
    .from("media_assets")
    .update({
      alt_text: input.altText,
      caption: input.caption || null,
      is_public: input.isPublic ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "media.updated",
    entity_type: "media_asset",
    entity_id: input.id,
    details: input,
  });

  revalidatePath("/gallery");
  revalidatePath("/admin/media");
  revalidatePath("/admin");
  return { success: true, message: "Media metadata updated successfully" };
}

export async function deleteMediaAssetAction(id: string): Promise<ActionResult> {
  const user = await requireCapability("media.manage");
  const supabase = await createClient();

  // Retrieve storage path before deletion
  const { data: asset } = await supabase
    .from("media_assets")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (asset?.storage_path) {
    const isStaticAsset =
      asset.storage_path.startsWith("/images/") ||
      asset.storage_path.startsWith("http://") ||
      asset.storage_path.startsWith("https://");

    if (!isStaticAsset) {
      const { error: storageError } = await supabase.storage
        .from("club-media")
        .remove([asset.storage_path]);

      if (storageError) {
        return {
          success: false,
          error: `Failed to remove storage object: ${storageError.message}`,
        };
      }
    }
  }

  const { error } = await supabase.from("media_assets").delete().eq("id", id);
  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "media.deleted",
    entity_type: "media_asset",
    entity_id: id,
  });

  revalidatePath("/gallery");
  revalidatePath("/admin/media");
  revalidatePath("/admin");
  return { success: true, message: "Media item removed successfully" };
}

export async function createMediaAssetAction(input: {
  storagePath: string;
  mimeType?: string;
  sizeBytes?: number;
  altText: string;
  caption?: string;
  isPublic?: boolean;
  width?: number;
  height?: number;
}): Promise<ActionResult<{ id: string }>> {
  const user = await requireCapability("media.manage");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      storage_path: input.storagePath,
      mime_type: input.mimeType || "image/jpeg",
      size_bytes: input.sizeBytes || 0,
      alt_text: input.altText,
      caption: input.caption || null,
      is_public: input.isPublic ?? true,
      width: input.width || 1200,
      height: input.height || 800,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "media.created",
    entity_type: "media_asset",
    entity_id: data.id,
    details: { storagePath: input.storagePath, altText: input.altText },
  });

  revalidatePath("/gallery");
  revalidatePath("/admin/media");
  revalidatePath("/admin");
  return { success: true, message: "Photo uploaded and published", data: { id: data.id } };
}

export async function uploadMediaAssetAction(
  formData: FormData,
): Promise<ActionResult<{ id: string; storagePath: string; url: string }>> {
  const user = await requireCapability("media.manage");
  const file = formData.get("file") as File | null;
  const altText = (formData.get("altText") as string) || "";
  const caption = (formData.get("caption") as string) || "";
  const isPublic = formData.get("isPublic") !== "false";

  if (!file || file.size === 0) {
    return { success: false, error: "Please select an image file to upload." };
  }
  if (!altText.trim()) {
    return { success: false, error: "Alternative text is required for accessibility." };
  }

  const supabase = await createClient();
  const rawBuffer = Buffer.from(await file.arrayBuffer());
  let uploadBuffer: Buffer | Uint8Array = rawBuffer;
  let mimeType = file.type || "image/jpeg";
  let width = 1200;
  let height = 800;
  let sizeBytes = file.size;

  try {
    const optimized = await optimizeImage(rawBuffer);
    uploadBuffer = optimized.optimizedBuffer;
    mimeType = optimized.mimeType;
    width = optimized.width;
    height = optimized.height;
    sizeBytes = optimized.sizeBytes;
  } catch (optErr) {
    // If not a standard raster image or optimization fails, fall back to rawBuffer
    console.warn("Image auto-optimization skipped/failed:", optErr);
  }

  const fileName = `${Date.now()}-${crypto.randomUUID()}.webp`;
  const storagePath = `gallery/${fileName}`;

  const storage = getStorageProvider();
  let uploadResult: { storagePath: string; url: string; provider: string };

  try {
    uploadResult = await storage.upload({
      bucket: "club-media",
      path: storagePath,
      buffer: uploadBuffer,
      contentType: mimeType,
    });
  } catch (err: unknown) {
    return {
      success: false,
      error: `Storage upload failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }

  const { data, error: dbError } = await supabase
    .from("media_assets")
    .insert({
      storage_path: uploadResult.storagePath,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      alt_text: altText.trim(),
      caption: caption.trim() || null,
      is_public: isPublic,
      width,
      height,
    })
    .select("id")
    .single();

  if (dbError) {
    await storage.delete("club-media", uploadResult.storagePath).catch(() => {});
    return { success: false, error: `Database record creation failed: ${dbError.message}` };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "media.uploaded",
    entity_type: "media_asset",
    entity_id: data.id,
    details: { storagePath: uploadResult.storagePath, altText, provider: uploadResult.provider },
  });

  revalidatePath("/gallery");
  revalidatePath("/admin/media");
  revalidatePath("/admin");
  return {
    success: true,
    message: "Photo uploaded and auto-optimized successfully",
    data: { id: data.id, storagePath: uploadResult.storagePath, url: uploadResult.url },
  };
}

export async function updateSiteContactAction(
  input: Partial<SiteContactSettings>,
): Promise<ActionResult> {
  const user = await requireCapability(["settings.manage", "content.manage"]);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "site_contact")
    .maybeSingle();

  const merged: SiteContactSettings = {
    ...DEFAULT_SITE_CONTACT,
    ...((existing?.value as Partial<SiteContactSettings>) || {}),
    ...input,
  };

  const { error } = await supabase.from("site_settings").upsert({
    key: "site_contact",
    value: merged as unknown as Database["public"]["Tables"]["site_settings"]["Insert"]["value"],
    description: "Primary contact details, mailing address, meeting location, and club motto",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "settings.updated",
    entity_type: "site_settings",
    entity_id: "site_contact",
    details: input as unknown as NonNullable<Json>,
  });

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return { success: true, message: "Site contact settings updated successfully" };
}

export async function updateHomePageContentAction(input: {
  motto?: string;
  story?: Partial<HomePageStory>;
  sections?: PageSection[];
}): Promise<ActionResult> {
  const user = await requireCapability(["content.manage", "settings.manage"]);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "homepage_content")
    .maybeSingle();

  const currentVal =
    (existing?.value as {
      story?: Partial<HomePageStory>;
      sections?: PageSection[];
      motto?: string;
    } | null) || {};

  const newVal = {
    motto: input.motto !== undefined ? input.motto : currentVal.motto,
    story: {
      ...DEFAULT_HOMEPAGE_STORY,
      ...(currentVal.story || {}),
      ...(input.story || {}),
    },
    sections: input.sections || currentVal.sections || DEFAULT_HOMEPAGE_SECTIONS,
  };

  const { error } = await supabase.from("site_settings").upsert({
    key: "homepage_content",
    value: newVal as unknown as Database["public"]["Tables"]["site_settings"]["Insert"]["value"],
    description: "Homepage motto, 4 core pillars, and community story",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Also sync motto to site_contact if motto was modified
  if (input.motto) {
    const { data: contactData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "site_contact")
      .maybeSingle();

    if (contactData?.value && typeof contactData.value === "object") {
      await supabase
        .from("site_settings")
        .update({
          value: {
            ...contactData.value,
            motto: input.motto,
          } as unknown as Database["public"]["Tables"]["site_settings"]["Insert"]["value"],
          updated_at: new Date().toISOString(),
        })
        .eq("key", "site_contact");
    }
  }

  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: "content.updated",
    entity_type: "site_settings",
    entity_id: "homepage_content",
    details: input as unknown as NonNullable<Json>,
  });

  revalidatePath("/");
  revalidatePath("/admin/content");
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return { success: true, message: "Homepage copy & pillars updated successfully" };
}
