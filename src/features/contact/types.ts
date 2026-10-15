export interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  message: string;
  honeypot?: string;
}

export interface ContactMessageRecord extends ContactInput {
  id: string;
  createdAt: string;
  status: "unread" | "read" | "archived" | "replied";
}
