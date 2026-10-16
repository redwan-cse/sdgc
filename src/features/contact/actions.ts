"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { contactSchema, type ContactFormData } from "./validation";
import type { ActionResult } from "@/features/auth/types";

export async function submitContactAction(
  input: ContactFormData,
): Promise<ActionResult<{ reference: string }>> {
  const result = contactSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: "Please correct the errors in the form.",
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  const { name, email, phone, message, honeypot } = result.data;

  // Bot detection: honeypot field must be empty
  if (honeypot && honeypot.length > 0) {
    // Silently drop spam without informing the bot
    return {
      success: true,
      data: {
        reference: `SDGC-BOT-${Math.floor(100000 + Math.random() * 900000)}`,
      },
    };
  }

  // Use server admin client to persist message and retrieve generated reference ID
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .insert({
      name,
      email,
      phone: phone || null,
      message,
      status: "unread",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to persist contact message:", error);
    return {
      success: false,
      error: "Unable to submit your message at this time. Please try again or email us directly.",
    };
  }

  const reference = `SDGC-MSG-${data.id.slice(0, 8).toUpperCase()}`;

  return {
    success: true,
    data: {
      reference,
    },
  };
}
