"use client";

import * as React from "react";
import type { ContactMessageRecord } from "@/features/contact/types";
import { Badge } from "@/components/ui/badge";

const INITIAL_MESSAGES: ContactMessageRecord[] = [
  {
    id: "msg-101",
    name: "Thomas Bailey",
    email: "tbailey@example.com",
    phone: "(269) 555-8821",
    message:
      "Hello! We recently purchased a home in Douglas with historic perennial gardens. Does SDGC offer garden consultations or have advice on restoring heirloom roses?",
    createdAt: "2026-10-14T15:30:00Z",
    status: "unread",
  },
  {
    id: "msg-102",
    name: "Sarah Jenkins",
    email: "sjenkins@example.com",
    phone: "",
    message:
      "I am interested in buying advance tickets for a group of 8 for the 2026 Garden Walk. Can tickets be mailed or held at will call?",
    createdAt: "2026-10-12T11:15:00Z",
    status: "read",
  },
];

export function AdminMessages() {
  const [messages, setMessages] = React.useState<ContactMessageRecord[]>(INITIAL_MESSAGES);
  const [activeMessage, setActiveMessage] = React.useState<ContactMessageRecord | null>(null);

  const handleMarkRead = (id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: "read" as const } : m)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Contact Submissions Inbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Private administrative inbox for inquiries submitted through the public website contact
          form.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="md:col-span-1 rounded-xl border border-border bg-card shadow-xs overflow-hidden divide-y divide-border">
          <div className="p-3 bg-muted/40 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
            Inquiries ({messages.length})
          </div>
          {messages.map((m) => {
            const isSelected = activeMessage?.id === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setActiveMessage(m);
                  if (m.status === "unread") handleMarkRead(m.id);
                }}
                className={`w-full text-left p-4 transition-colors hover:bg-muted/30 cursor-pointer ${
                  isSelected ? "bg-primary/10 border-l-4 border-primary" : ""
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm text-foreground">{m.name}</span>
                  {m.status === "unread" ? (
                    <Badge variant="warning">New</Badge>
                  ) : (
                    <Badge variant="outline">Read</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{m.message}</p>
                <span className="text-[10px] text-muted-foreground block mt-2">
                  {new Date(m.createdAt).toLocaleDateString()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Message Detail Pane */}
        <div className="md:col-span-2 rounded-xl border border-border bg-card p-6 shadow-xs">
          {activeMessage ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start border-b border-border pb-4">
                <div>
                  <h2 className="font-serif text-xl font-bold text-foreground">
                    {activeMessage.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Email:{" "}
                    <a
                      href={`mailto:${activeMessage.email}`}
                      className="text-primary hover:underline"
                    >
                      {activeMessage.email}
                    </a>
                  </p>
                  {activeMessage.phone && (
                    <p className="text-xs text-muted-foreground">Phone: {activeMessage.phone}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(activeMessage.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="prose prose-sm max-w-none text-foreground py-2 leading-relaxed">
                <p className="whitespace-pre-wrap">{activeMessage.message}</p>
              </div>

              <div className="pt-4 border-t border-border flex gap-3">
                <a
                  href={`mailto:${activeMessage.email}?subject=RE: Saugatuck Douglas Garden Club Inquiry`}
                  className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Reply via Email
                </a>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground">
              <p className="text-sm font-medium">Select a message from the list to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
