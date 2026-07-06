"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TextField } from "@/components/ui/TextField";
import { adminListAudit, type AdminAuditEntry } from "@/lib/admin-client";
import { AdminPageHeader, AdminPagination } from "@/features/admin/components/AdminUI";

const PAGE_SIZE = 20;

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch {
    return "—";
  }
};

export function AdminAuditPage() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AdminAuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminListAudit({ q, page });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được nhật ký");
    } finally {
      setLoading(false);
    }
  }, [q, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải lại khi bộ lọc đổi
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader title="Nhật ký quản trị" description="Mọi hành động thay đổi của quản trị viên đều được ghi lại." />

      <GlassPanel className="p-4 sm:p-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setQ(search.trim());
          }}
          className="max-w-md"
        >
          <TextField
            label="Tìm kiếm"
            leftIcon={<Search size={15} />}
            placeholder="Hành động, loại đối tượng…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </form>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="flex items-center gap-3 py-8 text-sm font-extrabold text-cosmic-mist">
              <Loader2 size={18} className="animate-spin text-cosmic-rose" aria-hidden="true" /> Đang tải…
            </div>
          ) : error ? (
            <p className="py-8 text-sm font-semibold text-[#ffd7e4]">{error}</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-sm font-semibold text-cosmic-mist">Chưa có nhật ký nào.</p>
          ) : (
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="text-[11.5px] font-bold uppercase tracking-wide text-[color:var(--ui-text-soft)]">
                  <th className="px-2 py-2">Thời gian</th>
                  <th className="px-2 py-2">Quản trị viên</th>
                  <th className="px-2 py-2">Hành động</th>
                  <th className="px-2 py-2">Đối tượng</th>
                  <th className="px-2 py-2">IP</th>
                </tr>
              </thead>
              <tbody>
                {items.map((entry) => (
                  <tr key={entry.id} className="border-t border-white/8">
                    <td className="px-2 py-2.5 text-[12px] font-semibold text-cosmic-mist">{formatDateTime(entry.createdAt)}</td>
                    <td className="px-2 py-2.5 text-[12.5px] font-semibold text-white">{entry.adminName ?? entry.adminEmail ?? "—"}</td>
                    <td className="px-2 py-2.5">
                      <span className="inline-flex items-center rounded-full border border-white/12 bg-white/5 px-2 py-0.5 font-mono text-[11.5px] font-bold text-[#e5deff]">
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-[12px] font-semibold text-cosmic-mist">
                      {entry.targetType ? `${entry.targetType}${entry.targetId ? `:${entry.targetId.slice(0, 8)}` : ""}` : "—"}
                    </td>
                    <td className="px-2 py-2.5 font-mono text-[11.5px] font-semibold text-[color:var(--ui-text-soft)]">{entry.ip ?? "—"}</td>
                  </tr>
                ))}
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
