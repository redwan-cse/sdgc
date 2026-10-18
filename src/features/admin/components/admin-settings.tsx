"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SiteContactSettings } from "@/features/content/types";
import { DEFAULT_SITE_CONTACT } from "@/features/content/types";
import { updateSiteContactAction } from "../actions";

interface AdminSettingsProps {
  initialSettings: SiteContactSettings;
}

export function AdminSettings({ initialSettings }: AdminSettingsProps) {
  const [form, setForm] = React.useState<SiteContactSettings>(initialSettings);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [isError, setIsError] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setForm(initialSettings);
  }, [initialSettings]);

  const handleChange = (field: keyof SiteContactSettings, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    if (confirm("Reset all contact settings to standard club defaults?")) {
      setForm(DEFAULT_SITE_CONTACT);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setIsError(false);
    setNotice(null);

    try {
      const res = await updateSiteContactAction(form);
      if (res.success) {
        setNotice("Site settings and contact information updated successfully.");
      } else {
        setIsError(true);
        setNotice(`Failed to save settings: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Site Settings & Contact Details
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage organization identity, telephone, email, mailing address, meeting location, and
            social links displayed across the public website and footer.
          </p>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={handleReset} disabled={isSaving}>
          Reset to Defaults
        </Button>
      </div>

      {notice && (
        <div
          className={`rounded-lg p-3 text-xs border ${
            isError
              ? "bg-rose-50 dark:bg-rose-950/30 border-rose-600/30 text-rose-800 dark:text-rose-300"
              : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-600/30 text-emerald-800 dark:text-emerald-300"
          }`}
          role="status"
        >
          {notice}
        </div>
      )}

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="space-y-0.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-primary">
            Operator Security &amp; Credentials
          </h2>
          <p className="text-xs text-muted-foreground">
            Looking to update your administrator password or manage Two-Factor Authentication (MFA /
            TOTP)?
          </p>
        </div>
        <Link
          href="/admin/settings/security"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 shadow-2xs"
        >
          <span>Admin Security &amp; MFA &rarr;</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organization Identity & Motto */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-lg font-bold text-foreground border-b border-border pb-3">
            Organization Identity & Mission Motto
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="setting-name"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
              >
                Legal Organization Name *
              </label>
              <Input
                id="setting-name"
                required
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="setting-tax-notice"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
              >
                Tax-Exempt Notice
              </label>
              <Input
                id="setting-tax-notice"
                value={form.taxExemptNotice}
                placeholder="501(c)(3) Nonprofit Organization"
                onChange={(e) => handleChange("taxExemptNotice", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="setting-motto"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
            >
              Club Motto & Mission Statement
            </label>
            <textarea
              id="setting-motto"
              rows={2}
              value={form.motto}
              onChange={(e) => handleChange("motto", e.target.value)}
              placeholder="We promote, encourage and support the use of flora to enrich and beautify..."
              className="w-full rounded-md border border-input bg-background p-3 text-sm text-foreground shadow-xs focus:ring-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Contact Numbers, Email & Mailing Address */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-lg font-bold text-foreground border-b border-border pb-3">
            Contact Channels & Physical Address
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="setting-phone"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
              >
                Phone Number
              </label>
              <Input
                id="setting-phone"
                type="tel"
                value={form.phone}
                placeholder="269-857-4148"
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="setting-email"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
              >
                Contact Email Address
              </label>
              <Input
                id="setting-email"
                type="email"
                value={form.email}
                placeholder="info@saugatuckdouglasgardenclub.com"
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label
                htmlFor="setting-address"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
              >
                Mailing Address Line (Street or P.O. Box)
              </label>
              <Input
                id="setting-address"
                value={form.address}
                placeholder="P.O. Box 1011"
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="setting-city"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
              >
                City
              </label>
              <Input
                id="setting-city"
                value={form.city}
                placeholder="Douglas"
                onChange={(e) => handleChange("city", e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="setting-state"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
              >
                State
              </label>
              <Input
                id="setting-state"
                value={form.state}
                placeholder="MI"
                onChange={(e) => handleChange("state", e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="setting-postal"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
              >
                Postal Code (ZIP)
              </label>
              <Input
                id="setting-postal"
                value={form.postalCode}
                placeholder="49406"
                onChange={(e) => handleChange("postalCode", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="setting-meeting-location"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
            >
              Primary Meeting Location
            </label>
            <Input
              id="setting-meeting-location"
              value={form.meetingLocation}
              placeholder="Old School House, 130 Center St, Douglas, MI"
              onChange={(e) => handleChange("meetingLocation", e.target.value)}
            />
          </div>
        </div>

        {/* Social Media & Online Profiles */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-lg font-bold text-foreground border-b border-border pb-3">
            Social Profiles & Links
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="setting-facebook"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
              >
                Facebook Page URL
              </label>
              <Input
                id="setting-facebook"
                type="url"
                value={form.facebookUrl}
                placeholder="https://www.facebook.com/..."
                onChange={(e) => handleChange("facebookUrl", e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="setting-instagram"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
              >
                Instagram Profile URL
              </label>
              <Input
                id="setting-instagram"
                type="url"
                value={form.instagramUrl}
                placeholder="https://www.instagram.com/..."
                onChange={(e) => handleChange("instagramUrl", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving Settings..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
