export const SENDER_TYPES = [
  "Prospective Member",
  "Current Active Member",
  "Garden Walk 2026 Guest",
  "Community Partner / Civic Leader",
  "Press / Media / Researcher",
  "General Inquirer",
] as const;

export type SenderType = (typeof SENDER_TYPES)[number];

export const INQUIRY_CATEGORIES = [
  "Membership & Annual Dues",
  "Garden Walk 2026",
  "Programs & Speaker Events",
  "Community Plantings & Workbees",
  "Scholarships, Grants & Donations",
  "Historical Archives & Heritage",
  "General Inquiry",
] as const;

export type InquiryCategory = (typeof INQUIRY_CATEGORIES)[number];

export interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  senderType?: string;
  category?: string;
  subject?: string;
  attachmentUrl?: string;
  message: string;
  honeypot?: string;
}

export interface ContactMessageRecord extends ContactInput {
  id: string;
  createdAt: string;
  status: "unread" | "read" | "archived" | "replied";
}
