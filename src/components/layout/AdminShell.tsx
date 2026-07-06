"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  LayoutDashboard,
  Loader2,
  LogOut,
  Megaphone,
  Menu,
  MessageCircleQuestion,
  ScrollText,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users2,
  HeartHandshake,
  X
} from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { cn } from "@/lib/cn";
import { useAuth } from "@/providers/AuthProvider";

const adminNav = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/users", label: "Người dùng", icon: Users2 },
  { href: "/admin/rooms", label: "Phòng đôi", icon: HeartHandshake },
  { href: "/admin/content", label: "Nội dung", icon: ScrollText },
  { href: "/admin/daily-questions", label: "Câu hỏi", icon: MessageCircleQuestion },
  { href: "/admin/broadcast", label: "Thông báo", icon: Megaphone },
  { href: "/admin/settings", label: "Cấu hình", icon: Settings },
  { href: "/admin/audit", label: "Nhật ký", icon: ShieldCheck }
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(href));
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, isAdmin, user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đóng drawer khi đổi route
    setDrawerOpen(false);
  }, [pathname]);

  // Đang xác thực phiên -> loader.
  if (status === "checking") {
    return (
      <main className="cosmic-page-shell grid min-h-[100dvh] place-items-center px-4 text-white">
        <GlassPanel className="flex items-center gap-3 px-6 py-5 text-sm font-extrabold text-cosmic-mist">
          <Loader2 size={18} className="animate-spin text-cosmic-rose motion-reduce:animate-none" aria-hidden="true" />
          Đang kiểm tra quyền truy cập…
        </GlassPanel>
      </main>
    );
  }

  // Không đăng nhập hoặc không phải admin -> chặn (guard chỉ là UX; backend vẫn enforce mọi /admin/*).
  if (status !== "authenticated" || !isAdmin) {
    return (
      <main className="cosmic-page-shell grid min-h-[100dvh] place-items-center px-4 text-white">
        <GlassPanel className="max-w-md p-6 text-center">
          <ShieldAlert size={28} className="mx-auto text-cosmic-gold" aria-hidden="true" />
          <h1 className="mt-3 text-lg font-black text-white">Khu vực quản trị</h1>
          <p className="mt-1 text-sm font-semibold text-cosmic-mist">
            Bạn không có quyền truy cập trang này. Vui lòng đăng nhập bằng tài khoản quản trị.
          </p>
          <div className="mt-5 flex justify-center">
            <ActionButton icon={<ArrowLeft size={15} />} onClick={() => router.replace("/")}>
              Về trang chính
            </ActionButton>
          </div>
        </GlassPanel>
      </main>
    );
  }

  const adminLabel = user?.profile?.displayName ?? user?.email ?? "Quản trị viên";

  function handleLogout() {
    logout();
    router.push("/");
  }

  function renderBrand() {
    return (
      <Link href="/admin" className="flex min-w-0 items-center gap-3 text-white">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/8 text-[color:var(--ui-accent)]">
          <ShieldCheck size={17} />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="ui-eyebrow">Cosmic Love</span>
          <span className="block truncate text-[15px] font-semibold text-white">Bảng quản trị</span>
        </span>
      </Link>
    );
  }

  function renderNavList(onSelect?: () => void) {
    return (
      <nav className="grid gap-0.5">
        {adminNav.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onSelect}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-[12px] px-3 text-[14px] font-semibold text-[color:var(--ui-text-muted)] transition hover:bg-white/6 hover:text-white",
                active && "bg-white/9 text-white"
              )}
            >
              <Icon size={17} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  function renderAccount() {
    return (
      <div className="rounded-[14px] border border-white/8 bg-white/[0.04] p-3">
        <p className="truncate text-[13.5px] font-semibold text-white">{adminLabel}</p>
        <p className="mt-0.5 text-[11.5px] font-medium text-[color:var(--ui-text-soft)]">Quản trị viên</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href="/dashboard"
            className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-white/10 text-[12.5px] font-semibold text-white transition hover:bg-white/6"
          >
            <ArrowLeft size={14} /> Về app
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-white/10 text-[12.5px] font-semibold text-[color:var(--ui-accent)] transition hover:bg-white/6"
          >
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="cosmic-page-shell relative min-h-[100dvh] overflow-hidden text-white" data-room-theme="violet">
      <div className="cosmic-room-wash pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto flex w-full max-w-[1480px] gap-5 px-3 py-3 pb-10 sm:px-4 lg:px-5 lg:py-5">
        <aside className="sticky top-5 hidden h-[calc(100vh-40px)] w-[244px] shrink-0 overflow-y-auto rounded-[14px] border border-white/10 bg-[#0e1024]/72 p-4 backdrop-blur-md lg:block">
          {renderBrand()}
          <div className="ui-divider my-4" />
          {renderNavList()}
          <div className="mt-6">
            <p className="ui-eyebrow">Tài khoản</p>
            <div className="mt-2">{renderAccount()}</div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 -mx-3 flex items-center justify-between gap-3 border-b border-white/8 bg-[#070817]/80 px-3 py-3 backdrop-blur-md sm:-mx-4 sm:px-4 lg:hidden">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setDrawerOpen((open) => !open)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-white/6 text-white"
                aria-expanded={drawerOpen}
                aria-label={drawerOpen ? "Đóng menu" : "Mở menu"}
              >
                {drawerOpen ? <X size={17} aria-hidden="true" /> : <Menu size={17} aria-hidden="true" />}
              </button>
              {renderBrand()}
            </div>
          </header>

          <div className="min-w-0 py-4 lg:py-0">{children}</div>
        </div>
      </div>

      {drawerOpen ? (
        <button
          type="button"
          aria-label="Đóng menu"
          className="fixed inset-0 z-30 bg-[#070817]/55 backdrop-blur-[2px] lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[82vw] max-w-[320px] flex-col gap-5 border-r border-white/10 bg-[#0a0c1f]/96 p-4 shadow-[22px_0_50px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-transform duration-200 lg:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!drawerOpen}
      >
        <div className="flex items-center justify-between">
          {renderBrand()}
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-[10px] border border-white/10 bg-white/6 text-white"
            aria-label="Đóng menu"
          >
            <X size={16} />
          </button>
        </div>
        <div className="grow overflow-y-auto pr-1">{renderNavList(() => setDrawerOpen(false))}</div>
        {renderAccount()}
      </aside>
    </main>
  );
}
