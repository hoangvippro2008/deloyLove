"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TextField } from "@/components/ui/TextField";
import { adminListRooms, type AdminRoom } from "@/lib/admin-client";
import { AdminPageHeader, AdminPagination } from "@/features/admin/components/AdminUI";

const PAGE_SIZE = 20;

const formatDate = (value: string | null) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return "—";
  }
};

export function AdminRoomsPage() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AdminRoom[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminListRooms({ q, status, page });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }, [q, status, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải lại khi bộ lọc đổi
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader title="Phòng đôi" description="Giám sát các phòng, thành viên và trạng thái ghép đôi." />
      <GlassPanel className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setQ(search.trim());
            }}
            className="min-w-0 flex-1"
          >
            <TextField
              label="Tìm kiếm"
              leftIcon={<Search size={15} />}
              placeholder="Tên phòng hoặc mã mời…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </form>
          <label className="text-[12px] font-semibold text-cosmic-mist sm:w-40">
            Trạng thái
            <select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value);
              }}
              className="mt-1 h-10 w-full rounded-[10px] border border-white/12 bg-white/5 px-2 text-[13px] font-semibold text-white"
            >
              <option value="">Tất cả</option>
              <option value="paired">Đã ghép</option>
              <option value="waiting">Đang chờ</option>
            </select>
          </label>
        </div>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="flex items-center gap-3 py-8 text-sm font-extrabold text-cosmic-mist">
              <Loader2 size={18} className="animate-spin text-cosmic-rose" aria-hidden="true" /> Đang tải…
            </div>
          ) : error ? (
            <p className="py-8 text-sm font-semibold text-[#ffd7e4]">{error}</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-sm font-semibold text-cosmic-mist">Không có phòng nào.</p>
          ) : (
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="text-[11.5px] font-bold uppercase tracking-wide text-[color:var(--ui-text-soft)]">
                  <th className="px-2 py-2">Phòng</th>
                  <th className="px-2 py-2">Mã mời</th>
                  <th className="px-2 py-2">Thành viên</th>
                  <th className="px-2 py-2">Trạng thái</th>
                  <th className="px-2 py-2">Tạo lúc</th>
                </tr>
              </thead>
              <tbody>
                {items.map((room) => (
                  <tr key={room.id} className="border-t border-white/8 transition hover:bg-white/[0.03]">
                    <td className="px-2 py-2.5">
                      <Link href={`/admin/rooms/${room.id}`} className="text-[13.5px] font-semibold text-white hover:underline">
                        {room.roomName}
                      </Link>
                    </td>
                    <td className="px-2 py-2.5 font-mono text-[12.5px] font-semibold text-cosmic-mist">{room.inviteCode}</td>
                    <td className="px-2 py-2.5 text-[13px] font-semibold text-white">{room.memberCount}/2</td>
                    <td className="px-2 py-2.5 text-[12.5px] font-semibold text-cosmic-mist">
                      {room.status === "paired" ? "Đã ghép" : "Đang chờ"}
                    </td>
                    <td className="px-2 py-2.5 text-[12.5px] font-semibold text-cosmic-mist">{formatDate(room.createdAt)}</td>
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
