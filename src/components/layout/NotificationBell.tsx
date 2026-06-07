"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, CheckCheck } from "lucide-react";
import { authRequest } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

type Noti = {
  id: string;
  type: string;
  title: string;
  content: string | null;
  isRead: boolean;
  createdAt: string | null;
};

type NotiResponse = { unreadCount: number; notifications: Noti[] };

function timeAgo(iso: string | null, now: number): string {
  if (!iso) return "";
  const diff = Math.max(0, now - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [data, setData] = useState<NotiResponse>({ unreadCount: 0, notifications: [] });
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await authRequest<NotiResponse>("/notifications");
      setData(res);
      setNow(Date.now());
    } catch {
      // im lặng nếu chưa có phòng / lỗi mạng
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- load() cập nhật state bất đồng bộ sau await + poll định kỳ + cờ mount cho portal (cố ý) */
  useEffect(() => {
    setMounted(true);
    void load();
    const timer = window.setInterval(() => {
      if (!document.hidden) void load();
    }, 25000);
    return () => window.clearInterval(timer);
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Đóng khi đổi kích thước cửa sổ (vị trí neo có thể lệch)
  useEffect(() => {
    if (!open) return;
    const onResize = () => setOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const width = Math.min(window.innerWidth - 24, 360);
      const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
      setPos({ top: rect.bottom + 10, left, width });
    }
    setOpen(true);
  };

  const markAll = async () => {
    setData((prev) => ({ unreadCount: 0, notifications: prev.notifications.map((item) => ({ ...item, isRead: true })) }));
    try {
      await authRequest("/notifications/read-all", { method: "PATCH" });
    } catch {
      // bỏ qua
    }
  };

  const markOne = async (id: string) => {
    setData((prev) => ({
      unreadCount: Math.max(0, prev.unreadCount - (prev.notifications.some((item) => item.id === id && !item.isRead) ? 1 : 0)),
      notifications: prev.notifications.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    }));
    try {
      await authRequest(`/notifications/${id}/read`, { method: "PATCH" });
    } catch {
      // bỏ qua
    }
  };

  return (
    <div className="inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label="Thông báo"
        className="relative grid h-9 w-9 place-items-center rounded-[10px] border border-white/10 bg-white/6 text-white transition hover:bg-white/12"
      >
        <Bell size={17} aria-hidden="true" />
        {data.unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[color:var(--ui-accent)] px-1 text-[10px] font-extrabold text-white">
            {data.unreadCount > 9 ? "9+" : data.unreadCount}
          </span>
        ) : null}
      </button>

      {open && mounted
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Đóng thông báo"
                className="fixed inset-0 z-[60] cursor-default"
                onClick={() => setOpen(false)}
              />
              <div
                style={{ top: pos?.top ?? 64, left: pos?.left ?? 12, width: pos?.width ?? 320 }}
                className="fixed z-[61] overflow-hidden rounded-[14px] border border-white/12 bg-[#0e1024]/95 shadow-[0_22px_60px_rgba(0,0,0,0.5)] backdrop-blur-md"
              >
                <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                  <p className="text-[13px] font-extrabold text-white">Thông báo</p>
                  {data.notifications.some((item) => !item.isRead) ? (
                    <button
                      type="button"
                      onClick={() => void markAll()}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-[color:var(--ui-accent)] hover:text-white"
                    >
                      <CheckCheck size={13} /> Đọc hết
                    </button>
                  ) : null}
                </div>
                <div className="max-h-[min(60vh,420px)] overflow-y-auto">
                  {data.notifications.length ? (
                    data.notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => void markOne(item.id)}
                        className={cn(
                          "flex w-full items-start gap-3 border-b border-white/6 px-4 py-3 text-left transition hover:bg-white/[0.05]",
                          !item.isRead && "bg-white/[0.04]"
                        )}
                      >
                        <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", item.isRead ? "bg-white/20" : "bg-[color:var(--ui-accent)]")} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-bold text-white">{item.title}</span>
                          {item.content ? (
                            <span className="mt-0.5 block text-[12px] leading-5 text-[color:var(--ui-text-muted)]">{item.content}</span>
                          ) : null}
                          <span className="mt-1 block text-[11px] text-[color:var(--ui-text-soft)]">{timeAgo(item.createdAt, now)}</span>
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-8 text-center text-[12.5px] text-[color:var(--ui-text-soft)]">Chưa có thông báo nào.</p>
                  )}
                </div>
              </div>
            </>,
            document.body
          )
        : null}
    </div>
  );
}
