import { AdminRoomDetailPage } from "@/features/admin/AdminRoomDetailPage";

export default async function AdminRoomDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminRoomDetailPage roomId={id} />;
}
