"use client";

import * as React from "react";
import Link from "next/link";
import { registerSchema, type RegisterFormData } from "../validation";
import { PROJECT_INTEREST_CHOICES, type ProjectInterestCode } from "@/features/membership/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";

export function RegisterForm() {
  const [formData, setFormData] = React.useState<RegisterFormData>({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneHome: "",
    phoneCell: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "MI",
    zipCode: "",
    birthMonth: undefined,
    birthDay: undefined,
    spouseFirstName: "",
    masterGardener: false,
    interestsExperience: "",
    projectInterests: [],
    password: "",
    passwordConfirmation: "",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleProjectToggle = (code: ProjectInterestCode) => {
    setFormData((prev) => {
      const exists = prev.projectInterests.includes(code);
      const updated = exists
        ? prev.projectInterests.filter((c) => c !== code)
        : [...prev.projectInterests, code];
      return { ...prev, projectInterests: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setStatusMessage(null);

    const result = registerSchema.safeParse(formData);
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
    // Preview interaction (P4 connects real Supabase Auth SSR signup)
    try {
      await new Promise((res) => setTimeout(res, 400));
      setStatusMessage(
        "Frontend preview: Registration form passed all client validations. Real user creation connects in Phase 4.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {statusMessage && (
        <div
          className="rounded-md bg-primary/10 border border-primary/20 p-4 text-sm text-primary"
          role="status"
        >
          {statusMessage}
        </div>
      )}

      {/* Account Identity */}
      <section className="space-y-4">
        <h3 className="font-serif text-lg font-bold text-foreground border-b border-border pb-2">
          Account Login Credentials
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="reg-username" required>
              Desired Username
            </Label>
            <Input
              id="reg-username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="e.g. daisy_miller"
              error={errors.username}
              aria-describedby={errors.username ? "username-error" : undefined}
            />
            {errors.username && (
              <p id="username-error" className="mt-1 text-xs text-destructive">
                {errors.username}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="reg-email" required>
              Email Address
            </Label>
            <Input
              id="reg-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="daisy@example.com"
              error={errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-xs text-destructive">
                {errors.email}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="reg-password" required>
              Password{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (Min. 12 characters)
              </span>
            </Label>
            <Input
              id="reg-password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••••••"
              error={errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && (
              <p id="password-error" className="mt-1 text-xs text-destructive">
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="reg-confirm-password" required>
              Confirm Password
            </Label>
            <Input
              id="reg-confirm-password"
              type="password"
              value={formData.passwordConfirmation}
              onChange={(e) => setFormData({ ...formData, passwordConfirmation: e.target.value })}
              placeholder="••••••••••••"
              error={errors.passwordConfirmation}
              aria-describedby={errors.passwordConfirmation ? "confirm-error" : undefined}
            />
            {errors.passwordConfirmation && (
              <p id="confirm-error" className="mt-1 text-xs text-destructive">
                {errors.passwordConfirmation}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Member Personal Details */}
      <section className="space-y-4">
        <h3 className="font-serif text-lg font-bold text-foreground border-b border-border pb-2">
          Member Contact & Address Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="reg-firstname" required>
              First Name
            </Label>
            <Input
              id="reg-firstname"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Daisy"
              error={errors.firstName}
              aria-describedby={errors.firstName ? "firstname-error" : undefined}
            />
            {errors.firstName && (
              <p id="firstname-error" className="mt-1 text-xs text-destructive">
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="reg-lastname" required>
              Last Name
            </Label>
            <Input
              id="reg-lastname"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Miller"
              error={errors.lastName}
              aria-describedby={errors.lastName ? "lastname-error" : undefined}
            />
            {errors.lastName && (
              <p id="lastname-error" className="mt-1 text-xs text-destructive">
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="reg-phone-home">Home Phone</Label>
            <Input
              id="reg-phone-home"
              type="tel"
              value={formData.phoneHome || ""}
              onChange={(e) => setFormData({ ...formData, phoneHome: e.target.value })}
              placeholder="(269) 555-0123"
            />
          </div>

          <div>
            <Label htmlFor="reg-phone-cell">Cell Phone</Label>
            <Input
              id="reg-phone-cell"
              type="tel"
              value={formData.phoneCell || ""}
              onChange={(e) => setFormData({ ...formData, phoneCell: e.target.value })}
              placeholder="(269) 555-0199"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="reg-address1">Street Address</Label>
          <Input
            id="reg-address1"
            value={formData.addressLine1 || ""}
            onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
            placeholder="123 Center Street"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="reg-city">City</Label>
            <Input
              id="reg-city"
              value={formData.city || ""}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Douglas"
            />
          </div>
          <div>
            <Label htmlFor="reg-state">State</Label>
            <Input
              id="reg-state"
              value={formData.state || "MI"}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="MI"
            />
          </div>
          <div>
            <Label htmlFor="reg-zip">ZIP Code</Label>
            <Input
              id="reg-zip"
              value={formData.zipCode || ""}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              placeholder="49406"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="reg-spouse">Spouse First Name</Label>
            <Input
              id="reg-spouse"
              value={formData.spouseFirstName || ""}
              onChange={(e) => setFormData({ ...formData, spouseFirstName: e.target.value })}
              placeholder="Robert"
            />
          </div>

          <div>
            <Label>
              Birthday{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (Month & Day only; year is not collected)
              </span>
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <label htmlFor="reg-birth-month" className="sr-only">
                  Birth Month
                </label>
                <Select
                  id="reg-birth-month"
                  value={formData.birthMonth ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      birthMonth: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                >
                  <option value="">Month</option>
                  {[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ].map((name, i) => (
                    <option key={name} value={i + 1}>
                      {name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor="reg-birth-day" className="sr-only">
                  Birth Day
                </label>
                <Input
                  id="reg-birth-day"
                  type="number"
                  min={1}
                  max={31}
                  placeholder="Day (1-31)"
                  value={formData.birthDay ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      birthDay: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  error={errors.birthDay}
                />
              </div>
            </div>
            {errors.birthDay && <p className="mt-1 text-xs text-destructive">{errors.birthDay}</p>}
          </div>
        </div>

        <div className="pt-2">
          <Checkbox
            id="reg-master-gardener"
            label="I am a certified Master Gardener"
            checked={formData.masterGardener}
            onChange={(e) => setFormData({ ...formData, masterGardener: e.target.checked })}
          />
        </div>

        <div>
          <Label htmlFor="reg-experience">Gardening Interests & Experience</Label>
          <Textarea
            id="reg-experience"
            rows={3}
            value={formData.interestsExperience || ""}
            onChange={(e) => setFormData({ ...formData, interestsExperience: e.target.value })}
            placeholder="Tell us what you enjoy growing, past gardening experience, or skills you'd love to share!"
          />
        </div>
      </section>

      {/* 8 Project Choices */}
      <section className="space-y-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-foreground">
            Club Projects & Volunteer Interests
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select the club programs you would like to participate in:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4">
          {PROJECT_INTEREST_CHOICES.map((choice) => (
            <Checkbox
              key={choice.code}
              id={`choice-${choice.code}`}
              label={choice.label}
              checked={formData.projectInterests.includes(choice.code)}
              onChange={() => handleProjectToggle(choice.code)}
            />
          ))}
        </div>
      </section>

      {/* Dues terms acknowledgment */}
      <div className="rounded-xl bg-muted/40 p-4 border border-border text-xs text-muted-foreground space-y-2">
        <p className="font-semibold text-foreground">Annual Membership Dues & Approval Policy:</p>
        <p>
          SDGC membership dues are $50 per calendar year (January 1 – December 31). In accordance
          with club bylaws, membership activation requires manual verification and approval by club
          leadership even after payment.
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting} size="lg" className="w-full sm:w-auto">
        {isSubmitting ? "Creating Profile..." : "Submit Member Profile & Application"}
      </Button>

      <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
        Already have a member account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign In Here &rarr;
        </Link>
      </div>
    </form>
  );
}
