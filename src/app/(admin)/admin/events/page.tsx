import { AdminEvents } from "@/features/admin/components/admin-events";
import { getAdminEvents } from "@/features/admin/queries";
import { requireCapability } from "@/features/auth/authorization";

export const metadata = {
  title: "Events & Scheduling",
};

export default async function AdminEventsPage() {
  await requireCapability("events.manage", "/admin/events");
  const events = await getAdminEvents();
  return <AdminEvents initialEvents={events} />;
}
