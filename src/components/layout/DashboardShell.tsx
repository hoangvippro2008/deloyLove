"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Album,
  CalendarDays,
  CalendarHeart,
  Flame,
  Gamepad2,
  Heart,
  Home,
  LetterText,
  LogOut,
  Menu,
  Music2,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  Wallet,
  X
} from "lucide-react";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { RoomMusic } from "@/components/layout/RoomMusic";
import { createMediaUrl } from "@/lib/api-client";
import { authRequest } from "@/lib/auth-client";
import { resolveAvatar } from "@/lib/avatars";
import { cn } from "@/lib/cn";
import { useAuth } from "@/providers/AuthProvider";

type RoomBadge = {
  roomName: string;
  coupleAvatarUrl: string | null;
  theme?: string;
};

const primaryNav = [
  { href: "/dashboard", label: "Phòng nhỏ", icon: Home },
  { href: "/letters", label: "Lời nhắn", icon: LetterText },
  { href: "/calendar", label: "Lịch hẹn", icon: CalendarDays },
  { href: "/album", label: "Ảnh", icon: Album },
  { href: "/memories", label: "Kỷ niệm", icon: CalendarHeart },
  { href: "/music", label: "Bài hát", icon: Music2 },
  { href: "/questions", label: "Tâm sự", icon: Sparkles },
  { href: "/bucket", label: "Mong ước", icon: Star },
  { href: "/wallet", label: "Ví chung", icon: Wallet },
  { href: "/stats", label: "Thành tựu", icon: Trophy },
  { href: "/challenges", label: "Thử thách", icon: Flame },
  { href: "/games", label: "Trò chơi", icon: Gamepad2 },
  { href: "/settings", label: "Cài đặt", icon: Settings }
];

const mobileTabs = primaryNav.slice(0, 4);

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, isGuest, logout, openAuth, user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fetchedRoomBadge, setFetchedRoomBadge] = useState<RoomBadge | null>(null);
  // guest thì luôn null (derive thay vì setState đồng bộ trong effect — react-hooks/set-state-in-effect)
  const roomBadge = isGuest ? null : fetchedRoomBadge;

  useEffect(() => {
    if (isGuest) {
      return;
    }

    authRequest<RoomBadge | null>("/room")
      .then(setFetchedRoomBadge)
      .catch(() => setFetchedRoomBadge(null));
  }, [isGuest]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đóng drawer khi điều hướng sang route khác (UI tạm thời)
    setDrawerOpen(false);
  }, [pathname]);

  const sidebarTitle = roomBadge?.roomName ?? "Phòng riêng";
  const roomBadgeAvatar = createMediaUrl(roomBadge?.coupleAvatarUrl) ?? null;
  const userLabel = user?.profile?.displayName ?? user?.email ?? "Khách tham quan";
  const avatarUrl = createMediaUrl(user?.profile?.avatarUrl);
  const fallbackAvatar = resolveAvatar({
    avatarUrl: user?.profile?.avatarUrl ?? null,
    id: user?.id ?? null,
    name: user?.profile?.displayName ?? user?.email ?? null,
    gender: user?.profile?.gender ?? null
  });
  const avatarSource = avatarUrl ?? fallbackAvatar;
  const roleLabel = isGuest ? "Khách" : "Thành viên";
  const navItems = isAdmin
    ? [...primaryNav, { href: "/admin", label: "Quản trị", icon: ShieldCheck }]
    : primaryNav;

  function handleLogout() {
    logout();
    setDrawerOpen(false);
    router.push("/");
  }

  function renderBrand({ compact = false }: { compact?: boolean } = {}) {
    return (
      <Link href="/" className="flex min-w-0 items-center gap-3 text-white">
        <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/12 bg-white/8 text-[color:var(--ui-accent)]">
          {roomBadgeAvatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={roomBadgeAvatar} alt={sidebarTitle} className="h-full w-full object-cover" />
          ) : (
            <Heart size={16} fill="currentColor" />
          )}
        </span>
        <span className="min-w-0 leading-tight">
          {!compact ? <span className="ui-eyebrow">Workspace</span> : null}
          <span className="block truncate text-[15px] font-semibold text-white">{sidebarTitle}</span>
        </span>
      </Link>
    );
  }

  function renderNavList(onSelect?: () => void) {
    return (
      <nav className="grid gap-0.5">
        {navItems.map((item) => {
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

  return (
    <main
      className="cosmic-page-shell relative min-h-[100dvh] overflow-hidden text-white"
      data-room-theme={roomBadge?.theme ?? "violet"}
    >
      <div className="cosmic-room-wash pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto flex w-full max-w-[1480px] gap-5 px-3 py-3 pb-24 sm:px-4 lg:px-5 lg:py-5 lg:pb-5">
        <aside className="sticky top-5 hidden h-[calc(100vh-40px)] w-[244px] shrink-0 overflow-y-auto rounded-[14px] border border-white/10 bg-[#0e1024]/72 p-4 backdrop-blur-md lg:block">
          {renderBrand()}

          {!isGuest ? (
            <div className="mt-3 flex justify-end">
              <NotificationBell />
            </div>
          ) : null}

          <div className="ui-divider my-4" />

          {renderNavList()}

          <div className="mt-6">
            <p className="ui-eyebrow">{isGuest ? "Khách" : "Tài khoản"}</p>
            <div className="mt-2 rounded-[14px] border border-white/8 bg-white/[0.04] p-3">
              {!isGuest ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/12 bg-white/6">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatarSource} alt={userLabel} className="h-full w-full object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-white">{userLabel}</span>
                      <span className="block text-[11.5px] font-medium text-[color:var(--ui-text-soft)]">{roleLabel}</span>
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link
                      href="/profile"
                      className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-white/10 text-[12.5px] font-semibold text-white transition hover:bg-white/6"
                    >
                      <UserRound size={14} /> Hồ sơ
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-white/10 text-[12.5px] font-semibold text-[color:var(--ui-accent)] transition hover:bg-white/6"
                    >
                      <LogOut size={14} /> Đăng xuất
                    </button>
                  </div>
                </>
              ) : (
                <button type="button" onClick={openAuth} className="only-button-primary w-full">
                  Đăng nhập
                </button>
              )}
            </div>
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
              {renderBrand({ compact: true })}
            </div>
            <div className="flex items-center gap-2">
              {!isGuest ? <NotificationBell /> : null}
              {!isGuest ? (
                <Link
                  href="/profile"
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-[10px] border border-white/10 bg-white/6"
                  aria-label="Xem hồ sơ"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarSource} alt={userLabel} className="h-full w-full object-cover" />
                </Link>
              ) : null}
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
          {renderBrand({ compact: true })}
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-[10px] border border-white/10 bg-white/6 text-white"
            aria-label="Đóng menu"
          >
            <X size={16} />
          </button>
        </div>

        <div className="rounded-[14px] border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/12 bg-white/6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarSource} alt={userLabel} className="h-full w-full object-cover" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-white">{userLabel}</p>
              <p className="mt-0.5 text-[12px] font-medium text-[color:var(--ui-text-soft)]">{roleLabel}</p>
            </div>
          </div>
        </div>

        <div className="grow overflow-y-auto pr-1">{renderNavList(() => setDrawerOpen(false))}</div>

        <div className="grid gap-2">
          {!isGuest ? (
            <>
              <Link
                href="/profile"
                onClick={() => setDrawerOpen(false)}
                className="only-button-secondary"
              >
                <UserRound size={15} /> Hồ sơ
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="only-button-secondary text-[color:var(--ui-accent)]"
              >
                <LogOut size={15} /> Đăng xuất
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                openAuth();
              }}
              className="only-button-primary"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </aside>

      <nav
        className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 items-center gap-1 rounded-[14px] border border-white/10 bg-[#0a0c1f]/92 p-1.5 shadow-[0_18px_36px_rgba(0,0,0,0.4)] backdrop-blur-md lg:hidden"
        style={{ bottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
      >
        {mobileTabs.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "grid h-12 place-items-center rounded-[12px] text-[10.5px] font-semibold text-[color:var(--ui-text-muted)] transition hover:bg-white/6 hover:text-white",
                active && "bg-white/9 text-white"
              )}
            >
              <Icon size={17} aria-hidden="true" />
              <span className="mt-0.5 max-w-full truncate px-1">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={cn(
            "grid h-12 place-items-center rounded-[12px] text-[10.5px] font-semibold text-[color:var(--ui-text-muted)] transition hover:bg-white/6 hover:text-white",
            drawerOpen && "bg-white/9 text-white"
          )}
        >
          <Menu size={17} aria-hidden="true" />
          <span className="mt-0.5">Thêm</span>
        </button>
      </nav>

      {!isGuest ? <RoomMusic /> : null}
    </main>
  );
}
