"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TextField } from "@/components/ui/TextField";
import { cn } from "@/lib/cn";
import {
  adminListContent,
  adminListContentTypes,
  type AdminContentItem,
  type AdminContentType
} from "@/lib/admin-client";
import { AdminPageHeader, AdminPagination } from "@/features/admin/components/AdminUI";

const PAGE_SIZE = 20;

const columnLabels: Record<string, string> = {
  title: "Tiêu đề",
  artist: "Nghệ sĩ",
  caption: "Chú thích",
  image_url: "Ảnh",
  memory_date: "Ngày",
  place_name: "Địa điểm",
  is_done: "Hoàn tất",
  status: "Trạng thái",
  category: "Danh mục",
  amount: "Số tiền",
  spent_at: "Chi lúc",
  event_type: "Loại",
  starts_at: "Bắt đầu",
  mood: "Tâm trạng",
  is_secret: "Bí mật",
  mood_date: "Ngày",
  created_at: "Tạo lúc"
};

function formatValue(key: string, value: unknown) {
  if (value === null || value === undefined) return "—";
  if (key === "is_done" || key === "is_secret") return value ? "Có" : "Không";
  if (key === "amount") return Number(value).toLocaleString("vi-VN");
  if (typeof value === "string" && /\d{4}-\d{2}-\d{2}T/.test(value)) {
    try {
      return new Date(value).toLocaleDateString("vi-VN");
    } catch {
      return value;
    }
  }
  const text = String(value);
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

export function AdminContentPage() {
  const [types, setTypes] = useState<AdminContentType[]>([]);
  const [activeType, setActiveType] = useState<string>("");
  const [columns, setColumns] = useState<string[]>([]);
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    adminListContentTypes()
      .then((list) => {
        if (!mounted) return;
        setTypes(list);
        setActiveType((current) => current || list[0]?.key || "");
      })
      .catch(() => setError("Không tải được loại nội dung"));
    return () => {
      mounted = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!activeType) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminListContent(activeType, { q, page });
      setColumns(data.columns);
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được nội dung");
    } finally {
      setLoading(false);
    }
  }, [activeType, q, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải lại khi đổi tab/bộ lọc
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader
        title="Nội dung"
        description="Giám sát nội dung người dùng đăng (chỉ xem). Thư và tâm trạng chỉ hiện metadata để tôn trọng riêng tư."
      />

      <div className="mb-3 flex flex-wrap gap-1.5">
        {types.map((type) => (
          <button
            key={type.key}
            type="button"
            onClick={() => {
              setActiveType(type.key);
              setPage(1);
              setQ("");
              setSearch("");
            }}
            className={cn(
              "h-9 rounded-full border px-3 text-[12.5px] font-semibold transition",
              activeType === type.key
                ? "border-[color:var(--ui-accent)]/40 bg-white/9 text-white"
                : "border-white/10 text-[color:var(--ui-text-muted)] hover:bg-white/6 hover:text-white"
            )}
          >
            {type.label}
          </button>
        ))}
      </div>

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
            placeholder="Từ khoá…"
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
            <p className="py-8 text-sm font-semibold text-cosmic-mist">Không có nội dung nào.</p>
          ) : (
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="text-[11.5px] font-bold uppercase tracking-wide text-[color:var(--ui-text-soft)]">
                  <th className="px-2 py-2">Phòng</th>
                  {columns.map((col) => (
                    <th key={col} className="px-2 py-2">
                      {columnLabels[col] ?? col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-white/8">
                    <td className="px-2 py-2.5 text-[12.5px] font-semibold text-white">{item.roomName}</td>
                    {columns.map((col) => (
                      <td key={col} className="px-2 py-2.5 text-[12.5px] font-semibold text-cosmic-mist">
                        {formatValue(col, item.values[col])}
                      </td>
                    ))}
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
