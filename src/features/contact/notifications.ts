import "server-only";

export interface ContactNotificationPayload {
  messageId: string;
  reference: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string | null;
  messageBody: string;
  submittedAt: string;
}

export interface NotificationDeliveryResult {
  success: boolean;
  deliveryMethod: "local_capture" | "simulated" | "deduplicated";
  deduplicationKey: string;
  recipient: string;
  subject: string;
}

// In-process deduplication cache to prevent duplicate email transmissions for the same message ID
const processedNotifications = new Set<string>();

/**
 * Dispatches staff notification for new contact submissions.
 * In accordance with project instructions and Work Package R6:
 * - Delivers to local capture (Mailpit) in development/testing.
 * - Does NOT send real external emails to live internet domains during tests.
 * - Enforces retry deduplication via unique message reference keys.
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

  const subject = `New Contact Inquiry from ${payload.senderName} [${payload.reference}]`;
  const recipient = "staff@sdgc.local";

  // 2. Local capture delivery
  // In our local Docker environment, Mailpit provides local mail capture on port 54324
  const mailpitApiUrl = process.env.MAILPIT_API_URL || "http://127.0.0.1:54324";

  let deliveryMethod: "local_capture" | "simulated" = "simulated";

  try {
    const res = await fetch(`${mailpitApiUrl}/api/v1/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        From: { Email: "inquiries@sdgc.local", Name: "SDGC Website" },
        To: [{ Email: recipient, Name: "SDGC Staff Inbox" }],
        Subject: subject,
        Text: `New Contact Submission:\n\nReference: ${payload.reference}\nFrom: ${payload.senderName} <${payload.senderEmail}>\nPhone: ${payload.senderPhone || "None"}\nDate: ${payload.submittedAt}\n\nMessage:\n${payload.messageBody}\n`,
      }),
      signal: AbortSignal.timeout(1000), // Fast timeout so tests never hang if Mailpit API is not listening
    });

    if (res.ok) {
      deliveryMethod = "local_capture";
    }
  } catch {
    // If Mailpit HTTP send API is unavailable, fallback to simulated capture without throwing
    deliveryMethod = "simulated";
  }

  // Mark as processed for deduplication
  processedNotifications.add(deduplicationKey);

  return {
    success: true,
    deliveryMethod,
    deduplicationKey,
    recipient,
    subject,
  };
}
