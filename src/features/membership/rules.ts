/**
 * Pure membership business rules.
 * Membership runs on calendar years calculated in America/Detroit.
 */

export function getMembershipYear(
  at: Date = new Date(),
  timeZone: string = "America/Detroit",
): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
  });
  return Number.parseInt(formatter.format(at), 10);
}

export function isMembershipActive(
  input: { approved: boolean; suspended: boolean; year: number; status?: string },
  at: Date = new Date(),
  timeZone: string = "America/Detroit",
): boolean {
  if (!input.approved || input.suspended) {
    return false;
  }
  if (input.status && input.status !== "approved") {
    return false;
  }
  const currentYear = getMembershipYear(at, timeZone);
  return input.year === currentYear;
}
