"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, HeartHandshake, Loader2, Users2, Wallet } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { adminGetMetrics, type AdminMetrics } from "@/lib/admin-client";
import { AdminPageHeader } from "@/features/admin/components/AdminUI";

function StatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <GlassPanel className="p-4">
      <p className="text-[12px] font-bold uppercase tracking-wide text-[color:var(--ui-text-soft)]">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
      {hint ? <p className="mt-0.5 text-[12px] font-semibold text-cosmic-mist">{hint}</p> : null}
    </GlassPanel>
  );
}

function SignupsChart({ series }: { series: AdminMetrics["signups"] }) {
  const max = Math.max(1, ...series.map((point) => point.count));
  return (
    <GlassPanel className="p-4 sm:p-5">
      <p className="text-[13px] font-black text-white">Đăng ký 14 ngày gần nhất</p>
      {series.length === 0 ? (
        <p className="mt-3 text-sm font-semibold text-cosmic-mist">Chưa có dữ liệu.</p>
      ) : (
        <div className="mt-4 flex h-32 items-end gap-1.5">
          {series.map((point) => (
            <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center gap-1" title={`${point.date}: ${point.count}`}>
              <div
                className="w-full rounded-t bg-[color:var(--ui-accent)]/70"
                style={{ height: `${Math.max(4, (point.count / max) * 100)}%` }}
                aria-hidden="true"
              />
              <span className="w-full truncate text-center text-[9px] font-semibold text-[color:var(--ui-text-soft)]">
                {point.date.slice(5)}
              </span>
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}

export function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMetrics(await adminGetMetrics());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được số liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải số liệu khi mở trang
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader title="Tổng quan quản trị" description="Số liệu toàn hệ thống Cosmic Love." />

      {loading ? (
        <GlassPanel className="flex items-center gap-3 p-6 text-sm font-extrabold text-cosmic-mist">
          <Loader2 size={18} className="animate-spin text-cosmic-rose" aria-hidden="true" /> Đang tải…
        </GlassPanel>
      ) : error || !metrics ? (
        <GlassPanel className="p-6">
          <p className="text-sm font-semibold text-[#ffd7e4]">{error ?? "Không có dữ liệu"}</p>
        </GlassPanel>
      ) : (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Người dùng" value={metrics.users.total} hint={`${metrics.users.active} hoạt động`} />
            <StatTile label="Đang online" value={metrics.users.onlineNow} hint="5 phút gần đây" />
            <StatTile label="Mới (7 ngày)" value={metrics.users.new7d} />
            <StatTile label="Bị khoá" value={metrics.users.blocked} hint={`${metrics.users.deleted} đã xoá`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Phòng đôi" value={metrics.rooms.total} />
              <StatTile label="Đã ghép" value={metrics.rooms.paired} hint={`${metrics.rooms.pairingRate}% ghép đôi`} />
              <StatTile label="Đang chờ" value={metrics.rooms.waiting} />
              <StatTile label="Quản trị viên" value={metrics.users.admins} />
            </div>
            <SignupsChart series={metrics.signups} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Kỷ niệm" value={metrics.content.memories} />
            <StatTile label="Bài hát" value={metrics.content.songs} />
            <StatTile label="Ảnh" value={metrics.content.photos} />
            <StatTile label="Thư" value={metrics.content.letters} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/admin/users"><GlassPanel className="flex items-center gap-3 p-4 transition hover:bg-white/[0.04]"><Users2 size={18} className="text-[color:var(--ui-accent)]" /><span className="text-[14px] font-black text-white">Quản lý người dùng</span></GlassPanel></Link>
            <Link href="/admin/rooms"><GlassPanel className="flex items-center gap-3 p-4 transition hover:bg-white/[0.04]"><HeartHandshake size={18} className="text-[color:var(--ui-accent)]" /><span className="text-[14px] font-black text-white">Giám sát phòng</span></GlassPanel></Link>
            <Link href="/admin/audit"><GlassPanel className="flex items-center gap-3 p-4 transition hover:bg-white/[0.04]"><Activity size={18} className="text-[color:var(--ui-accent)]" /><span className="text-[14px] font-black text-white">Nhật ký quản trị</span></GlassPanel></Link>
          </div>

          <p className="text-[12px] font-semibold text-[color:var(--ui-text-soft)]">
            <Wallet size={13} className="mr-1 inline" aria-hidden="true" />
            Tổng chi tiêu ví chung: {metrics.content.walletTotal.toLocaleString("vi-VN")} đ
          </p>
        </div>
      )}
    </div>
  );
}
