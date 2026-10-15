import type { ApplicationStatus, PaymentStatus } from "@/features/membership/types";

export interface AdminMetrics {
  totalMembers: number;
  pendingApprovals: number;
  unreconciledPayments: number;
  upcomingEvents: number;
  unreadMessages: number;
}

export interface AdminMemberRecord {
  id: string;
  userId: string;
  username: string;
  name: string;
  email: string;
  year: number;
  applicationStatus: ApplicationStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  isApproved: boolean;
  isSuspended: boolean;
  roles: string[];
  appliedAt: string;
}

export interface AdminAuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorEmail: string;
  createdAt: string;
  details?: Record<string, unknown>;
}
