"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, Loader2, Lock, ShieldCheck, ShieldOff, Trash2, Unlock } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { CosmicModal } from "@/components/ui/CosmicModal";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useToast } from "@/components/ui/ToastProvider";
import { createMediaUrl } from "@/lib/api-client";
import {
  adminGetUser,
  adminResetUserPassword,
  adminSetUserRole,
  adminSetUserStatus,
  type AdminUserDetail
} from "@/lib/admin-client";
import { AdminPageHeader, RoleBadge, StatusBadge } from "@/features/admin/components/AdminUI";

type PendingAction = {
  title: string;
  message: string;
  confirmLabel: string;
  run: () => Promise<AdminUserDetail | { tempPassword: string }>;
};

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch {
    return "—";
  }
};

export function AdminUserDetailPage({ userId }: { userId: string }) {
  const { notify } = useToast();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUser(await adminGetUser(userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được người dùng");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải chi tiết người dùng khi mở trang
    void load();
  }, [load]);

  const runPending = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      const result = await pending.run();
      if ("tempPassword" in result) {
        setTempPassword(result.tempPassword);
        notify({ title: "Đã đặt lại mật khẩu", tone: "success" });
        void load();
      } else {
        setUser(result);
        notify({ title: "Thành công", message: "Đã cập nhật người dùng.", tone: "success" });
      }
      setPending(null);
    } catch (err) {
      notify({ title: "Không thành công", message: err instanceof Error ? err.message : "Có lỗi xảy ra", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <GlassPanel className="p-6">
        <div className="flex items-center gap-3 text-sm font-extrabold text-cosmic-mist">
          <Loader2 size={18} className="animate-spin text-cosmic-rose" aria-hidden="true" /> Đang tải…
        </div>
      </GlassPanel>
    );
  }

  if (error || !user) {
    return (
      <GlassPanel className="p-6">
        <p className="text-sm font-semibold text-[#ffd7e4]">{error ?? "Không tìm thấy người dùng"}</p>
        <div className="mt-4">
          <ActionButton href="/admin/users" icon={<ArrowLeft size={15} />}>
            Về danh sách
          </ActionButton>
        </div>
      </GlassPanel>
    );
  }

  const avatar = createMediaUrl(user.avatarUrl);
  const isBlocked = user.status === "BLOCKED";
  const isDeleted = user.status === "DELETED";

  return (
    <div>
      <AdminPageHeader
        title="Chi tiết người dùng"
        actions={
          <ActionButton href="/admin/users" icon={<ArrowLeft size={15} />}>
            Về danh sách
          </ActionButton>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <GlassPanel className="p-5">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-white/12 bg-white/6 text-xl font-bold text-white">
              {avatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                user.name.slice(0, 1).toUpperCase()
              )}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-black text-white">{user.name}</h2>
              <p className="truncate text-sm font-semibold text-cosmic-mist">{user.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={user.status} />
                <RoleBadge role={user.role} />
              </div>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 text-[13px]">
            <div>
              <dt className="font-semibold text-[color:var(--ui-text-soft)]">Đăng nhập gần nhất</dt>
              <dd className="font-bold text-white">{formatDateTime(user.lastLoginAt)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[color:var(--ui-text-soft)]">Hoạt động gần nhất</dt>
              <dd className="font-bold text-white">{formatDateTime(user.lastSeenAt)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[color:var(--ui-text-soft)]">Ngày tham gia</dt>
              <dd className="font-bold text-white">{formatDateTime(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[color:var(--ui-text-soft)]">ID</dt>
              <dd className="truncate font-mono text-[11px] font-bold text-cosmic-mist">{user.id}</dd>
            </div>
          </dl>

          <div className="ui-divider my-4" />
          <p className="ui-eyebrow">Phòng đôi</p>
          {user.rooms.length === 0 ? (
            <p className="mt-2 text-sm font-semibold text-cosmic-mist">Chưa tham gia phòng nào.</p>
          ) : (
            <ul className="mt-2 grid gap-2">
              {user.rooms.map((room) => (
                <li key={room.id} className="flex items-center justify-between rounded-[10px] border border-white/8 bg-white/[0.03] px-3 py-2">
                  <span className="min-w-0">
                    <Link href={`/admin/rooms/${room.id}`} className="block truncate text-[13.5px] font-semibold text-white hover:underline">
                      {room.roomName}
                    </Link>
                    <span className="text-[11.5px] font-medium text-[color:var(--ui-text-soft)]">
                      {room.role === "owner" ? "Chủ phòng" : "Thành viên"} · {room.status}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>

        <GlassPanel className="p-5">
          <p className="ui-eyebrow">Thao tác</p>
          <div className="mt-3 grid gap-2">
            {isBlocked || isDeleted ? (
              <ActionButton
                variant="secondary"
                icon={<Unlock size={15} />}
                onClick={() =>
                  setPending({
                    title: "Mở khoá tài khoản",
                    message: `Đưa "${user.name}" về trạng thái hoạt động?`,
                    confirmLabel: "Mở khoá",
                    run: () => adminSetUserStatus(user.id, "ACTIVE")
                  })
                }
              >
                Mở khoá (kích hoạt)
              </ActionButton>
            ) : (
              <ActionButton
                variant="secondary"
                icon={<Lock size={15} />}
                onClick={() =>
                  setPending({
                    title: "Khoá tài khoản",
                    message: `Khoá "${user.name}"? Người dùng sẽ không đăng nhập được.`,
                    confirmLabel: "Khoá",
                    run: () => adminSetUserStatus(user.id, "BLOCKED")
                  })
                }
              >
                Khoá tài khoản
              </ActionButton>
            )}

            {user.role === "ADMIN" ? (
              <ActionButton
                variant="secondary"
                icon={<ShieldOff size={15} />}
                onClick={() =>
                  setPending({
                    title: "Gỡ quyền quản trị",
                    message: `Hạ "${user.name}" xuống người dùng thường?`,
                    confirmLabel: "Gỡ quyền",
                    run: () => adminSetUserRole(user.id, "USER")
                  })
                }
              >
                Gỡ quyền quản trị
              </ActionButton>
            ) : (
              <ActionButton
                variant="secondary"
                icon={<ShieldCheck size={15} />}
                onClick={() =>
                  setPending({
                    title: "Nâng quyền quản trị",
                    message: `Cấp quyền quản trị cho "${user.name}"?`,
                    confirmLabel: "Nâng quyền",
                    run: () => adminSetUserRole(user.id, "ADMIN")
                  })
                }
              >
                Nâng quyền quản trị
              </ActionButton>
            )}

            <ActionButton
              variant="secondary"
              icon={<KeyRound size={15} />}
              onClick={() =>
                setPending({
                  title: "Đặt lại mật khẩu",
                  message: `Tạo mật khẩu tạm cho "${user.name}"? Mật khẩu sẽ hiện 1 lần để bạn gửi cho họ.`,
                  confirmLabel: "Đặt lại",
                  run: () => adminResetUserPassword(user.id)
                })
              }
            >
              Đặt lại mật khẩu
            </ActionButton>

            {!isDeleted ? (
              <ActionButton
                variant="secondary"
                className="text-[color:var(--ui-accent)]"
                icon={<Trash2 size={15} />}
                onClick={() =>
                  setPending({
                    title: "Xoá tài khoản (mềm)",
                    message: `Xoá mềm "${user.name}"? Dữ liệu vẫn giữ nhưng tài khoản bị vô hiệu hoá.`,
                    confirmLabel: "Xoá mềm",
                    run: () => adminSetUserStatus(user.id, "DELETED")
                  })
                }
              >
                Xoá tài khoản (mềm)
              </ActionButton>
            ) : null}
          </div>

          {tempPassword ? (
            <div className="mt-4 rounded-[12px] border border-[#a7f3d0]/25 bg-[#10261f]/50 p-3">
              <p className="text-[12px] font-bold text-[#d7f9e9]">Mật khẩu tạm (chỉ hiện 1 lần):</p>
              <p className="mt-1 break-all font-mono text-sm font-black text-white">{tempPassword}</p>
            </div>
          ) : null}
        </GlassPanel>
      </div>

      <CosmicModal open={pending !== null} onClose={() => (busy ? undefined : setPending(null))} title={pending?.title ?? ""}>
        <p className="text-sm font-semibold text-cosmic-mist">{pending?.message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <ActionButton variant="ghost" onClick={() => setPending(null)} disabled={busy}>
            Huỷ
          </ActionButton>
          <ActionButton onClick={runPending} disabled={busy} icon={busy ? <Loader2 size={15} className="animate-spin" /> : undefined}>
            {pending?.confirmLabel ?? "Xác nhận"}
          </ActionButton>
        </div>
      </CosmicModal>
    </div>
  );
}
