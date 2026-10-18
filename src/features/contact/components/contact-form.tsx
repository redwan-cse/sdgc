"use client";

import * as React from "react";
import { submitContactAction } from "../actions";
import { contactSchema, type ContactFormData } from "../validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function ContactForm() {
  const [mounted, setMounted] = React.useState(false);
  const [formData, setFormData] = React.useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-muted/40 rounded" />
            <div className="h-10 w-full rounded-md border border-input bg-background/50" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted/40 rounded" />
            <div className="h-10 w-full rounded-md border border-input bg-background/50" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-muted/40 rounded" />
          <div className="h-10 w-full rounded-md border border-input bg-background/50" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 bg-muted/40 rounded" />
          <div className="h-28 w-full rounded-md border border-input bg-background/50" />
        </div>
        <div className="h-10 w-36 rounded-md bg-primary/20" />
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
        setFormData({ name: "", email: "", phone: "", message: "", honeypot: "" });
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
        className="rounded-xl border border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/20 p-8 text-center"
        role="status"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 mb-4">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-serif text-2xl font-bold text-foreground">
          Thank you for reaching out!
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Your message has been received by the Saugatuck Douglas Garden Club volunteer staff.
        </p>
        <p className="mt-4 text-xs font-mono text-muted-foreground">
          Confirmation Reference:{" "}
          <span className="font-bold text-foreground">{submittedReference}</span>
        </p>
        <div className="mt-6">
          <Button variant="outline" onClick={() => setSubmittedReference(null)}>
            Send Another Message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6" suppressHydrationWarning>
      {errors.form && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive"
        >
          {errors.form}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div suppressHydrationWarning>
          <Label htmlFor="contact-name" required>
            Your Name
          </Label>
          <Input
            id="contact-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Jane Doe"
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
            placeholder="jane@example.com"
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

      <div suppressHydrationWarning>
        <Label htmlFor="contact-message" required>
          Message
        </Label>
        <Textarea
          id="contact-message"
          rows={5}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="How can we help you? Ask about club membership, the Garden Walk, volunteer opportunities, or our community beautification projects."
          error={errors.message}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
        />
        {errors.message && (
          <p id="contact-message-error" className="mt-1 text-xs text-destructive">
            {errors.message}
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

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? "Sending Message..." : "Submit Message"}
      </Button>
    </form>
  );
}
