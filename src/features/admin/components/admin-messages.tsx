"use client";

import * as React from "react";
import type { AdminMessageRecord } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateMessageStatusAction } from "../actions";

interface AdminMessagesProps {
  initialMessages: AdminMessageRecord[];
  initialFilter?: string;
}

export function AdminMessages({ initialMessages, initialFilter }: AdminMessagesProps) {
  const [messages, setMessages] = React.useState<AdminMessageRecord[]>(initialMessages);
  const [selectedMessageId, setSelectedMessageId] = React.useState<string | null>(
    initialMessages[0]?.id || null,
  );
  const [filter, setFilter] = React.useState<string>(initialFilter || "all");
  const [notice, setNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMessages(initialMessages);
    if (!selectedMessageId && initialMessages.length > 0) {
      setSelectedMessageId(initialMessages[0]?.id ?? null);
    }
  }, [initialMessages, selectedMessageId]);

  const activeMessage = React.useMemo(() => {
    return messages.find((m) => m.id === selectedMessageId) || null;
  }, [messages, selectedMessageId]);

  const filteredMessages = React.useMemo(() => {
    if (filter === "unread") return messages.filter((m) => m.status === "unread");
    if (filter === "read") return messages.filter((m) => m.status === "read");
    if (filter === "archived") return messages.filter((m) => m.status === "archived");
    return messages;
  }, [messages, filter]);

  const handleStatusChange = async (id: string, newStatus: "unread" | "read" | "archived") => {
    const res = await updateMessageStatusAction(id, newStatus);
    if (res.success) {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m)));
      setNotice(`Message marked as ${newStatus}.`);
    }
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

      {notice && (
        <div
          className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-600/30 p-3 text-xs text-emerald-800 dark:text-emerald-300"
          role="status"
        >
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="md:col-span-1 rounded-xl border border-border bg-card shadow-xs overflow-hidden divide-y divide-border">
          <div className="p-3 bg-muted/40 flex items-center justify-between gap-2">
            <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Inquiries ({filteredMessages.length})
            </span>
            <div className="flex items-center gap-1 text-[11px]">
              {[
                { id: "all", label: "All" },
                { id: "unread", label: "Unread" },
                { id: "read", label: "Read" },
                { id: "archived", label: "Archived" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    filter === f.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {filteredMessages.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No inquiries match the current filter.
            </div>
          ) : (
            filteredMessages.map((m) => {
              const isSelected = activeMessage?.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedMessageId(m.id);
                    if (m.status === "unread") {
                      handleStatusChange(m.id, "read");
                    }
                  }}
                  className={`w-full text-left p-4 transition-colors hover:bg-muted/30 cursor-pointer ${
                    isSelected ? "bg-primary/10 border-l-4 border-primary" : ""
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm text-foreground">{m.name}</span>
                    {m.status === "unread" ? (
                      <Badge variant="warning">New</Badge>
                    ) : m.status === "archived" ? (
                      <Badge variant="outline">Archived</Badge>
                    ) : (
                      <Badge variant="secondary">Read</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{m.message}</p>
                  <span className="text-[10px] text-muted-foreground block mt-2">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </span>
                </button>
              );
            })
          )}
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
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(activeMessage.createdAt).toLocaleString()}
                  </span>
                  <Badge variant={activeMessage.status === "unread" ? "warning" : "outline"}>
                    {activeMessage.status}
                  </Badge>
                </div>
              </div>

              <div className="prose prose-sm max-w-none text-foreground py-2 leading-relaxed">
                <p className="whitespace-pre-wrap">{activeMessage.message}</p>
              </div>

              <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <a
                  href={`mailto:${activeMessage.email}?subject=RE: Saugatuck Douglas Garden Club Inquiry`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <svg
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                    />
                  </svg>
                  Open in Email App (mailto:)
                </a>

                <div className="space-x-2">
                  {activeMessage.status !== "archived" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(activeMessage.id, "archived")}
                    >
                      Archive Message
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(activeMessage.id, "read")}
                    >
                      Move to Inbox
                    </Button>
                  )}
                </div>
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
