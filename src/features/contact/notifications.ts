import "server-only";

export interface ContactNotificationPayload {
  messageId: string;
  reference: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string | null;
  senderType?: string | null;
  category?: string | null;
  subject?: string | null;
  attachmentUrl?: string | null;
  messageBody: string;
  submittedAt: string;
}

export interface NotificationDeliveryResult {
  success: boolean;
  deliveryMethod: "local_capture" | "simulated" | "deduplicated" | "failed";
  deduplicationKey: string;
  recipient: string;
  subject: string;
}

// In-process deduplication cache to prevent duplicate email transmissions for the same message ID
const processedNotifications = new Set<string>();

export function clearProcessedNotifications() {
  processedNotifications.clear();
}

/**
 * Dispatches staff notification for new contact submissions.
 * In accordance with project instructions and Work Package R6 / V11-10:
 * - Delivers to local capture (Mailpit) in development/testing.
 * - Enforces retry deduplication ONLY after successful acknowledgment.
 * - On capture failure, reports failure without marking as deduplicated, permitting bounded retry.
 */
export async function dispatchContactNotification(
  payload: ContactNotificationPayload,
): Promise<NotificationDeliveryResult> {
  const deduplicationKey = `contact_msg_${payload.messageId}`;

  // 1. Check for deduplication
  if (processedNotifications.has(deduplicationKey)) {
    return {
      success: true,
      deliveryMethod: "deduplicated",
      deduplicationKey,
      recipient: "staff@sdgc.local",
      subject: `[Deduplicated] Inquiry from ${payload.senderName} (${payload.reference})`,
    };
  }

  const emailSubject = payload.subject
    ? `[${payload.category || "Inquiry"}] ${payload.subject} — ${payload.senderName} [${payload.reference}]`
    : `New Contact Inquiry from ${payload.senderName} [${payload.reference}]`;
  const recipient = "staff@sdgc.local";

  // 2. Local capture delivery
  // In our local Docker environment, Mailpit provides local mail capture on port 54324
  const mailpitApiUrl = process.env.MAILPIT_API_URL || "http://127.0.0.1:54324";

  try {
    const res = await fetch(`${mailpitApiUrl}/api/v1/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        From: { Email: "inquiries@sdgc.local", Name: "SDGC Website" },
        To: [{ Email: recipient, Name: "SDGC Staff Inbox" }],
        Subject: emailSubject,
        Text: `New Contact Submission:\n\nReference: ${payload.reference}\nFrom: ${payload.senderName} <${payload.senderEmail}>\nPhone: ${payload.senderPhone || "None"}\nSender Type: ${payload.senderType || "Not specified"}\nCategory: ${payload.category || "General"}\nSubject: ${payload.subject || "No Subject"}\nAttachment: ${payload.attachmentUrl || "None"}\nDate: ${payload.submittedAt}\n\nMessage:\n${payload.messageBody}\n`,
      }),
      signal: AbortSignal.timeout(1000), // Fast timeout so tests never hang if Mailpit API is not listening
    });

    if (res.ok) {
      // Mark as processed only upon real acknowledgment
      processedNotifications.add(deduplicationKey);
      return {
        success: true,
        deliveryMethod: "local_capture",
        deduplicationKey,
        recipient,
        subject: emailSubject,
      };
    }

    return {
      success: false,
      deliveryMethod: "failed",
      deduplicationKey,
      recipient,
      subject: emailSubject,
    };
  } catch {
    // If Mailpit HTTP send API is unreachable, do not record in processedNotifications
    // so retry is allowed once connectivity is restored
    return {
      success: false,
      deliveryMethod: "failed",
      deduplicationKey,
      recipient,
      subject: emailSubject,
    };
  }
}
