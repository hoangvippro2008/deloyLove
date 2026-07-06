"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TextField } from "@/components/ui/TextField";
import { createMediaUrl } from "@/lib/api-client";
import {
  adminListUsers,
  type AdminUser,
  type AdminUserRole,
  type AdminUserStatus
} from "@/lib/admin-client";
import { AdminPageHeader, AdminPagination, RoleBadge, StatusBadge } from "@/features/admin/components/AdminUI";

const PAGE_SIZE = 20;

const formatDate = (value: string | null) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "—";
  }
};

export function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<AdminUserStatus | "">("");
  const [role, setRole] = useState<AdminUserRole | "">("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminListUsers({ q, status, role, page, pageSize: PAGE_SIZE, sort: "created_at", order: "desc" });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }, [q, status, role, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải lại danh sách khi bộ lọc đổi
    void load();
  }, [load]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setQ(search.trim());
  };

  const onFilterChange = (next: { status?: AdminUserStatus | ""; role?: AdminUserRole | "" }) => {
    setPage(1);
    if (next.status !== undefined) setStatus(next.status);
    if (next.role !== undefined) setRole(next.role);
  };

  return (
    <div>
      <AdminPageHeader title="Người dùng" description="Quản lý tài khoản: tìm kiếm, khoá/mở, đặt lại mật khẩu, phân quyền." />

      <GlassPanel className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <form onSubmit={submitSearch} className="min-w-0 flex-1">
            <TextField
              label="Tìm kiếm"
              leftIcon={<Search size={15} />}
              placeholder="Tên hoặc email…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </form>
          <div className="grid grid-cols-2 gap-2 sm:w-auto">
            <label className="text-[12px] font-semibold text-cosmic-mist">
              Trạng thái
              <select
                value={status}
                onChange={(event) => onFilterChange({ status: event.target.value as AdminUserStatus | "" })}
                className="mt-1 h-10 w-full rounded-[10px] border border-white/12 bg-white/5 px-2 text-[13px] font-semibold text-white"
              >
                <option value="">Tất cả</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="BLOCKED">Đã khoá</option>
                <option value="DELETED">Đã xoá</option>
              </select>
            </label>
            <label className="text-[12px] font-semibold text-cosmic-mist">
              Vai trò
              <select
                value={role}
                onChange={(event) => onFilterChange({ role: event.target.value as AdminUserRole | "" })}
                className="mt-1 h-10 w-full rounded-[10px] border border-white/12 bg-white/5 px-2 text-[13px] font-semibold text-white"
              >
                <option value="">Tất cả</option>
                <option value="USER">Người dùng</option>
                <option value="ADMIN">Quản trị</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="flex items-center gap-3 py-8 text-sm font-extrabold text-cosmic-mist">
              <Loader2 size={18} className="animate-spin text-cosmic-rose" aria-hidden="true" /> Đang tải…
            </div>
          ) : error ? (
            <p className="py-8 text-sm font-semibold text-[#ffd7e4]">{error}</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-sm font-semibold text-cosmic-mist">Không có người dùng nào khớp bộ lọc.</p>
          ) : (
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="text-[11.5px] font-bold uppercase tracking-wide text-[color:var(--ui-text-soft)]">
                  <th className="px-2 py-2">Người dùng</th>
                  <th className="px-2 py-2">Trạng thái</th>
                  <th className="px-2 py-2">Vai trò</th>
                  <th className="px-2 py-2">Đăng nhập gần nhất</th>
                  <th className="px-2 py-2">Tham gia</th>
                </tr>
              </thead>
              <tbody>
                {items.map((user) => {
                  const avatar = createMediaUrl(user.avatarUrl);
                  return (
                    <tr key={user.id} className="border-t border-white/8 transition hover:bg-white/[0.03]">
                      <td className="px-2 py-2.5">
                        <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-white/12 bg-white/6 text-[12px] font-bold text-white">
                            {avatar ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={avatar} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                              user.name.slice(0, 1).toUpperCase()
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[13.5px] font-semibold text-white">{user.name}</span>
                            <span className="block truncate text-[12px] font-medium text-[color:var(--ui-text-soft)]">
                              {user.email}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-2 py-2.5">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-2 py-2.5">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-2 py-2.5 text-[12.5px] font-semibold text-cosmic-mist">
                        {formatDate(user.lastLoginAt)}
                      </td>
                      <td className="px-2 py-2.5 text-[12.5px] font-semibold text-cosmic-mist">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && !error && total > 0 ? (
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        ) : null}
      </GlassPanel>
    </div>
  );
}
