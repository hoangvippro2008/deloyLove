import { AdminUserDetailPage } from "@/features/admin/AdminUserDetailPage";

export default async function AdminUserDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminUserDetailPage userId={id} />;
}
