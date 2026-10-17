import { AdminMedia } from "@/features/admin/components/admin-media";
import { listStaffMedia, listMediaAlbums } from "@/features/media/queries";
import { requireCapability } from "@/features/auth/authorization";

export const metadata = {
  title: "Media & Albums",
};

export default async function AdminMediaPage() {
  await requireCapability("media.manage", "/admin/media");
  const [media, albums] = await Promise.all([listStaffMedia(), listMediaAlbums()]);
  return <AdminMedia initialMedia={media} initialAlbums={albums} />;
}
