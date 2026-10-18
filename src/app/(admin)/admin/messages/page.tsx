import { AdminMessages } from "@/features/admin/components/admin-messages";
import { getAdminMessages } from "@/features/admin/queries";
import { requireCapability } from "@/features/auth/authorization";

export const metadata = {
  title: "Contact Messages Inbox",
};

interface AdminMessagesPageProps {
  searchParams?: Promise<{ status?: string }>;
}

export default async function AdminMessagesPage({ searchParams }: AdminMessagesPageProps) {
  await requireCapability("messages.manage", "/admin/messages");
  const params = await searchParams;
  const messages = await getAdminMessages();
  return <AdminMessages initialMessages={messages} initialFilter={params?.status} />;
}
