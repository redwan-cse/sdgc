import { AdminMessages } from "@/features/admin/components/admin-messages";
import { getAdminMessages } from "@/features/admin/queries";
import { requireCapability } from "@/features/auth/authorization";

export const metadata = {
  title: "Contact Messages Inbox",
};

export default async function AdminMessagesPage() {
  await requireCapability("messages.manage", "/admin/messages");
  const messages = await getAdminMessages();
  return <AdminMessages initialMessages={messages} />;
}
