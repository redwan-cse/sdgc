"use client";

import * as React from "react";
import { memberProfileSchema, type MemberProfileFormData } from "../validation";
import {
  PROJECT_INTEREST_CHOICES,
  type MemberProfile,
  type MemberProfileInput,
  type ProjectInterestCode,
} from "../types";
import { updateOwnProfileAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";

interface ProfileEditorProps {
  initialProfile: MemberProfile;
}

export function ProfileEditor({ initialProfile }: ProfileEditorProps) {
  const [formData, setFormData] = React.useState<MemberProfileFormData>({
    username: initialProfile.username,
    firstName: initialProfile.firstName,
    lastName: initialProfile.lastName,
    email: initialProfile.email,
    phoneHome: initialProfile.phoneHome || "",
    phoneCell: initialProfile.phoneCell || "",
    addressLine1: initialProfile.addressLine1 || "",
    addressLine2: initialProfile.addressLine2 || "",
    city: initialProfile.city || "",
    state: initialProfile.state || "MI",
    zipCode: initialProfile.zipCode || "",
    birthMonth: initialProfile.birthMonth,
    birthDay: initialProfile.birthDay,
    spouseFirstName: initialProfile.spouseFirstName || "",
    masterGardener: initialProfile.masterGardener,
    directoryOptOut: initialProfile.directoryOptOut ?? false,
    interestsExperience: initialProfile.interestsExperience || "",
    projectInterests: initialProfile.projectInterests,
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleProjectToggle = (code: ProjectInterestCode) => {
    setFormData((prev) => {
      const exists = prev.projectInterests.includes(code);
      const updated = exists
        ? prev.projectInterests.filter((c) => c !== code)
        : [...prev.projectInterests, code];
      return { ...prev, projectInterests: updated };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setStatusMessage(null);

    const result = memberProfileSchema.safeParse(formData);
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

    setIsSaving(true);
    try {
      const payload: MemberProfileInput = {
        ...result.data,
        birthMonth: result.data.birthMonth ?? undefined,
        birthDay: result.data.birthDay ?? undefined,
        projectInterests: result.data.projectInterests as ProjectInterestCode[],
      };
      const res = await updateOwnProfileAction(payload);
      if (res.success) {
        setStatusMessage("Profile updated successfully!");
      } else {
        setStatusMessage(null);
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
      setStatusMessage("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} noValidate className="space-y-8">
      {statusMessage && (
        <div
          className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-600/30 p-4 text-sm text-emerald-800 dark:text-emerald-300"
          role="status"
        >
          {statusMessage}
        </div>
      )}

      {/* Account Info (Read-only or restricted) */}
      <section className="space-y-4 rounded-xl bg-muted/30 p-4 border border-border">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Member Identification
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-muted-foreground block">Username</span>
            <span className="text-sm font-bold text-foreground font-mono">
              @{initialProfile.username}
            </span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              Fixed club handle
            </span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Email Address</span>
            <span className="text-sm font-medium text-foreground">{initialProfile.email}</span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              Email changes require verified security workflow
            </span>
          </div>
        </div>
      </section>

      {/* Editable Name & Address */}
      <section className="space-y-4">
        <h3 className="font-serif text-lg font-bold text-foreground border-b border-border pb-2">
          Contact & Address
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="prof-firstname" required>
              First Name
            </Label>
            <Input
              id="prof-firstname"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              error={errors.firstName}
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-destructive">{errors.firstName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="prof-lastname" required>
              Last Name
            </Label>
            <Input
              id="prof-lastname"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              error={errors.lastName}
            />
            {errors.lastName && <p className="mt-1 text-xs text-destructive">{errors.lastName}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="prof-phone-home">Home Phone</Label>
            <Input
              id="prof-phone-home"
              value={formData.phoneHome || ""}
              onChange={(e) => setFormData({ ...formData, phoneHome: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="prof-phone-cell">Cell Phone</Label>
            <Input
              id="prof-phone-cell"
              value={formData.phoneCell || ""}
              onChange={(e) => setFormData({ ...formData, phoneCell: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="prof-address1">Street Address</Label>
          <Input
            id="prof-address1"
            value={formData.addressLine1 || ""}
            onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="prof-address2">Address Line 2 (Apt, Suite, Unit)</Label>
          <Input
            id="prof-address2"
            value={formData.addressLine2 || ""}
            onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="prof-city">City</Label>
            <Input
              id="prof-city"
              value={formData.city || ""}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="prof-state">State</Label>
            <Input
              id="prof-state"
              value={formData.state || "MI"}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="prof-zip">ZIP Code</Label>
            <Input
              id="prof-zip"
              value={formData.zipCode || ""}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* Personal & Gardening */}
      <section className="space-y-4">
        <h3 className="font-serif text-lg font-bold text-foreground border-b border-border pb-2">
          Personal & Horticultural Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="prof-spouse">Spouse First Name</Label>
            <Input
              id="prof-spouse"
              value={formData.spouseFirstName || ""}
              onChange={(e) => setFormData({ ...formData, spouseFirstName: e.target.value })}
            />
          </div>

          <div>
            <Label>
              Birthday{" "}
              <span className="text-xs font-normal text-muted-foreground">(Month & Day)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <label htmlFor="prof-birth-month" className="sr-only">
                  Birth Month
                </label>
                <Select
                  id="prof-birth-month"
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
                <label htmlFor="prof-birth-day" className="sr-only">
                  Birth Day
                </label>
                <Input
                  id="prof-birth-day"
                  type="number"
                  min={1}
                  max={31}
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

        <div className="pt-2 space-y-3">
          <Checkbox
            id="prof-master-gardener"
            label="I am a certified Master Gardener"
            checked={formData.masterGardener}
            onChange={(e) => setFormData({ ...formData, masterGardener: e.target.checked })}
          />

          <Checkbox
            id="prof-directory-opt-out"
            label="Directory Privacy: Do not display my profile in the member directory"
            checked={Boolean(formData.directoryOptOut)}
            onChange={(e) => setFormData({ ...formData, directoryOptOut: e.target.checked })}
          />
        </div>

        <div>
          <Label htmlFor="prof-experience">Gardening Interests & Experience</Label>
          <Textarea
            id="prof-experience"
            rows={3}
            value={formData.interestsExperience || ""}
            onChange={(e) => setFormData({ ...formData, interestsExperience: e.target.value })}
          />
        </div>
      </section>

      {/* 8 Project Interests */}
      <section className="space-y-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-foreground">
            Project Participation Choices
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Update your volunteer interest preferences at any time:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4">
          {PROJECT_INTEREST_CHOICES.map((choice) => (
            <Checkbox
              key={choice.code}
              id={`prof-choice-${choice.code}`}
              label={choice.label}
              checked={formData.projectInterests.includes(choice.code)}
              onChange={() => handleProjectToggle(choice.code)}
            />
          ))}
        </div>
      </section>

      <Button type="submit" disabled={isSaving} size="lg">
        {isSaving ? "Saving Changes..." : "Save Profile Updates"}
      </Button>
    </form>
  );
}
