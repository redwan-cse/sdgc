"use client";

import * as React from "react";
import type { DirectoryMember } from "../types";
import { PROJECT_INTEREST_CHOICES } from "../types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface MemberDirectoryProps {
  initialMembers: DirectoryMember[];
}

export function MemberDirectory({ initialMembers }: MemberDirectoryProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedInterest, setSelectedInterest] = React.useState<string>("all");
  const [masterGardenerOnly, setMasterGardenerOnly] = React.useState(false);

  const filteredMembers = React.useMemo(() => {
    return initialMembers.filter((m) => {
      // Text search: matches full name, username, city, or bio
      const matchesSearch =
        searchTerm.trim() === "" ||
        m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Boolean(m.city?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        Boolean(m.interestsExperience?.toLowerCase().includes(searchTerm.toLowerCase()));

      // Committee / project interest filter
      const matchesInterest =
        selectedInterest === "all" || m.projectInterests.includes(selectedInterest);

      // Master gardener filter
      const matchesMG = !masterGardenerOnly || m.isMasterGardener;

      return matchesSearch && matchesInterest && matchesMG;
    });
  }, [initialMembers, searchTerm, selectedInterest, masterGardenerOnly]);

  return (
    <div className="space-y-8">
      {/* Controls Bar */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label
              htmlFor="directory-search"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Search Members
            </label>
            <Input
              id="directory-search"
              placeholder="Search by member name, username, city, or interests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="w-full sm:w-64">
            <label
              htmlFor="committee-filter"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Filter by Committee
            </label>
            <select
              id="committee-filter"
              value={selectedInterest}
              onChange={(e) => setSelectedInterest(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Committees & Projects</option>
              {PROJECT_INTEREST_CHOICES.map((choice) => (
                <option key={choice.code} value={choice.code}>
                  {choice.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              checked={masterGardenerOnly}
              onChange={(e) => setMasterGardenerOnly(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary h-4 w-4"
            />
            <span>Master Gardeners Only</span>
          </label>

          <span className="text-muted-foreground font-medium">
            Showing {filteredMembers.length} of {initialMembers.length} active members
          </span>
        </div>
      </div>

      {/* Directory Grid */}
      {filteredMembers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
          <div className="text-3xl">🌱</div>
          <h3 className="font-serif text-lg font-bold text-foreground">No members found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search terms or clearing the committee filters to see more members.
          </p>
          {(searchTerm || selectedInterest !== "all" || masterGardenerOnly) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedInterest("all");
                setMasterGardenerOnly(false);
              }}
              className="text-xs font-semibold text-primary hover:underline pt-2 cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => {
            const initials =
              `${member.firstName[0] || ""}${member.lastName[0] || ""}`.toUpperCase();
            return (
              <div
                key={member.id}
                className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-serif text-base font-bold text-primary shrink-0">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-bold text-foreground leading-snug">
                          {member.fullName}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          @{member.username}
                        </p>
                      </div>
                    </div>

                    {member.isMasterGardener && (
                      <Badge variant="success" className="shrink-0 text-[10px]">
                        Master Gardener
                      </Badge>
                    )}
                  </div>

                  {/* Contact & Location */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {(member.city || member.state) && (
                      <p className="flex items-center gap-1.5">
                        <span className="text-foreground/70 font-medium">📍 Location:</span>
                        <span>
                          {[member.city, member.state].filter(Boolean).join(", ")}
                          {member.postalCode ? ` ${member.postalCode}` : ""}
                        </span>
                      </p>
                    )}
                    {member.phone && (
                      <p className="flex items-center gap-1.5">
                        <span className="text-foreground/70 font-medium">📞 Phone:</span>
                        <a
                          href={`tel:${member.phone.replace(/[^0-9+]/g, "")}`}
                          className="hover:text-primary transition-colors"
                        >
                          {member.phone}
                        </a>
                      </p>
                    )}
                  </div>

                  {/* Experience Bio */}
                  {member.interestsExperience && (
                    <p className="text-xs text-muted-foreground/90 italic bg-muted/40 p-2.5 rounded-lg border border-border/50">
                      &ldquo;{member.interestsExperience}&rdquo;
                    </p>
                  )}
                </div>

                {/* Project Interests */}
                {member.projectInterests.length > 0 && (
                  <div className="pt-3 border-t border-border/50">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
                      Volunteer Committees
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {member.projectInterests.map((code) => {
                        const choice = PROJECT_INTEREST_CHOICES.find((c) => c.code === code);
                        return (
                          <Badge
                            key={code}
                            variant="secondary"
                            className="text-[10px] py-0 px-2 font-normal"
                          >
                            {choice?.label || code}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
