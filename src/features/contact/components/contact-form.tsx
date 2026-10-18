"use client";

import * as React from "react";
import { submitContactAction } from "../actions";
import { type ContactFormData, contactSchema } from "../validation";
import { SENDER_TYPES, INQUIRY_CATEGORIES } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function ContactForm() {
  const [mounted, setMounted] = React.useState(false);
  const [formData, setFormData] = React.useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    senderType: "",
    category: "",
    subject: "",
    attachmentUrl: "",
    message: "",
    honeypot: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submittedReference, setSubmittedReference] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-6 w-44 bg-muted/60 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-10 bg-muted/40 rounded-md" />
          <div className="h-10 bg-muted/40 rounded-md" />
        </div>
        <div className="h-10 bg-muted/40 rounded-md" />
        <div className="h-10 bg-muted/40 rounded-md" />
        <div className="h-28 bg-muted/40 rounded-md" />
        <div className="h-10 w-36 bg-primary/20 rounded-md" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitContactAction(formData);
      if (res.success) {
        setSubmittedReference(res.data.reference);
        setFormData({
          name: "",
          email: "",
          phone: "",
          senderType: "",
          category: "",
          subject: "",
          attachmentUrl: "",
          message: "",
          honeypot: "",
        });
      } else {
        if (res.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.fieldErrors)) {
            if (v?.[0]) mapped[k] = v[0];
          }
          setErrors(mapped);
        } else {
          setErrors({ form: res.error });
        }
      }
    } catch {
      setErrors({ form: "An unexpected network error occurred. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedReference) {
    return (
      <div
        className="rounded-2xl border border-emerald-600/30 bg-emerald-50/80 dark:bg-emerald-950/20 p-8 sm:p-10 text-center"
        role="status"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 mb-5 shadow-xs">
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
          Thank you for reaching out!
        </h3>
        <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Your inquiry has been delivered directly to the Saugatuck Douglas Garden Club volunteer
          officers and leadership team.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-card/80 border border-border px-4 py-2 text-xs font-mono text-muted-foreground shadow-2xs">
          <span>Tracking Reference:</span>
          <span className="font-bold text-foreground">{submittedReference}</span>
        </div>
        <div className="mt-8">
          <Button variant="outline" onClick={() => setSubmittedReference(null)}>
            Send Another Inquiry
          </Button>
        </div>
      </div>
    );
  }

  const messageLength = formData.message.length;
  const isOverLimit = messageLength > 1000;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5" suppressHydrationWarning>
      <div className="border-b border-border/60 pb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Send us a message</h2>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <svg
              className="h-3.5 w-3.5 text-primary shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>We typically respond within 2–3 business days.</span>
          </p>
        </div>
      </div>

      {errors.form && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive"
        >
          {errors.form}
        </div>
      )}

      {/* Row 1: Name and Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div suppressHydrationWarning>
          <Label htmlFor="contact-name" required>
            Your Name
          </Label>
          <Input
            id="contact-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Margaret Fuller"
            error={errors.name}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
          />
          {errors.name && (
            <p id="contact-name-error" className="mt-1 text-xs text-destructive">
              {errors.name}
            </p>
          )}
        </div>

        <div suppressHydrationWarning>
          <Label htmlFor="contact-email" required>
            Email Address
          </Label>
          <Input
            id="contact-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="you@example.com"
            error={errors.email}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
          />
          {errors.email && (
            <p id="contact-email-error" className="mt-1 text-xs text-destructive">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      {/* Row 2: I am a... (Persona) */}
      <div suppressHydrationWarning>
        <Label htmlFor="contact-sender-type">I am a...</Label>
        <Select
          id="contact-sender-type"
          value={formData.senderType || ""}
          onChange={(e) => setFormData({ ...formData, senderType: e.target.value })}
        >
          <option value="">Select your affiliation or inquiry background</option>
          {SENDER_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
      </div>

      {/* Row 3: Phone number */}
      <div suppressHydrationWarning>
        <Label htmlFor="contact-phone">
          Phone Number <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
        </Label>
        <Input
          id="contact-phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="(269) 555-0123"
        />
      </div>

      {/* Row 4: Inquiry category */}
      <div suppressHydrationWarning>
        <Label htmlFor="contact-category">Inquiry Category</Label>
        <Select
          id="contact-category"
          value={formData.category || ""}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        >
          <option value="">Select inquiry category</option>
          {INQUIRY_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </Select>
      </div>

      {/* Row 5: Subject line */}
      <div suppressHydrationWarning>
        <Label htmlFor="contact-subject">Subject</Label>
        <Input
          id="contact-subject"
          value={formData.subject || ""}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="e.g. 2026 Garden Walk ticket confirmation or Workbee RSVP"
          error={errors.subject}
          aria-describedby={errors.subject ? "contact-subject-error" : undefined}
        />
        {errors.subject && (
          <p id="contact-subject-error" className="mt-1 text-xs text-destructive">
            {errors.subject}
          </p>
        )}
      </div>

      {/* Row 6: Message textarea with character counter */}
      <div suppressHydrationWarning>
        <div className="flex items-center justify-between mb-1.5">
          <Label htmlFor="contact-message" required className="mb-0">
            Message
          </Label>
          <span
            className={`text-[11px] font-mono transition-colors ${
              isOverLimit
                ? "text-destructive font-bold"
                : messageLength > 850
                  ? "text-amber-600 dark:text-amber-400 font-semibold"
                  : "text-muted-foreground"
            }`}
          >
            {messageLength} / 1000
          </span>
        </div>
        <Textarea
          id="contact-message"
          rows={5}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Write your message here. Inquiries regarding club membership, historical records, Garden Walk tickets, or community garden plantings are welcome."
          error={errors.message}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
        />
        {errors.message && (
          <p id="contact-message-error" className="mt-1 text-xs text-destructive">
            {errors.message}
          </p>
        )}
      </div>

      {/* Row 7: Attachment or document URL */}
      <div suppressHydrationWarning>
        <Label htmlFor="contact-attachment">
          Attachment or Document Link{" "}
          <span className="text-xs text-muted-foreground font-normal">
            (Optional Google Drive, Dropbox, or proposal link)
          </span>
        </Label>
        <Input
          id="contact-attachment"
          type="url"
          value={formData.attachmentUrl || ""}
          onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
          placeholder="https://drive.google.com/..."
          error={errors.attachmentUrl}
          aria-describedby={errors.attachmentUrl ? "contact-attachment-error" : undefined}
        />
        {errors.attachmentUrl && (
          <p id="contact-attachment-error" className="mt-1 text-xs text-destructive">
            {errors.attachmentUrl}
          </p>
        )}
      </div>

      {/* Hidden honeypot field for bot spam deterrence */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="contact-honeypot">Leave this blank</label>
        <input
          id="contact-honeypot"
          type="text"
          name="honeypot"
          tabIndex={-1}
          autoComplete="off"
          value={formData.honeypot}
          onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={isSubmitting || isOverLimit}
          className="w-full sm:w-auto min-w-[180px] shadow-sm"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-current"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Sending Inquiry...</span>
            </span>
          ) : (
            "Submit Message"
          )}
        </Button>
      </div>
    </form>
  );
}
