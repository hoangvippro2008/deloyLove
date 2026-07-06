"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2, UserMinus } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { CosmicModal } from "@/components/ui/CosmicModal";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useToast } from "@/components/ui/ToastProvider";
import { createMediaUrl } from "@/lib/api-client";
import { adminGetRoom, adminRemoveRoomMember, type AdminRoomDetail, type AdminRoomMember } from "@/lib/admin-client";
import { AdminPageHeader } from "@/features/admin/components/AdminUI";

const countLabels: Record<string, string> = {
  memories: "Kỷ niệm",
  letters: "Thư",
  photos: "Ảnh",
  songs: "Bài hát",
  events: "Sự kiện",
  tasks: "Việc",
  bucket: "Mong ước",
  wallet: "Ví"
};

export function AdminRoomDetailPage({ roomId }: { roomId: string }) {
  const { notify } = useToast();
  const [room, setRoom] = useState<AdminRoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingMember, setPendingMember] = useState<AdminRoomMember | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRoom(await adminGetRoom(roomId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được phòng");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải chi tiết phòng khi mở trang
    void load();
  }, [load]);

  const confirmRemove = async () => {
    if (!pendingMember) return;
    setBusy(true);
    try {
      const updated = await adminRemoveRoomMember(roomId, pendingMember.userId);
      setRoom(updated);
      notify({ title: "Đã gỡ thành viên", message: "Trạng thái phòng sẽ tự cập nhật.", tone: "success" });
      setPendingMember(null);
    } catch (err) {
      notify({ title: "Không thành công", message: err instanceof Error ? err.message : "Có lỗi xảy ra", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <GlassPanel className="flex items-center gap-3 p-6 text-sm font-extrabold text-cosmic-mist">
        <Loader2 size={18} className="animate-spin text-cosmic-rose" aria-hidden="true" /> Đang tải…
      </GlassPanel>
    );
  }

  if (error || !room) {
    return (
      <GlassPanel className="p-6">
        <p className="text-sm font-semibold text-[#ffd7e4]">{error ?? "Không tìm thấy phòng"}</p>
        <div className="mt-4">
          <ActionButton href="/admin/rooms" icon={<ArrowLeft size={15} />}>
            Về danh sách
          </ActionButton>
        </div>
      </GlassPanel>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title={room.roomName}
        description={`Mã mời ${room.inviteCode} · ${room.status === "paired" ? "Đã ghép" : "Đang chờ"}`}
        actions={
          <ActionButton href="/admin/rooms" icon={<ArrowLeft size={15} />}>
            Về danh sách
          </ActionButton>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <GlassPanel className="p-5">
          <p className="ui-eyebrow">Thành viên</p>
          {room.members.length === 0 ? (
            <p className="mt-2 text-sm font-semibold text-cosmic-mist">Phòng chưa có thành viên.</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {room.members.map((member) => {
                const avatar = createMediaUrl(member.avatarUrl);
                return (
                  <li key={member.userId} className="flex items-center justify-between gap-3 rounded-[12px] border border-white/8 bg-white/[0.03] p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-white/12 bg-white/6 text-[13px] font-bold text-white">
                        {avatar ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={avatar} alt={member.name} className="h-full w-full object-cover" />
                        ) : (
                          member.name.slice(0, 1).toUpperCase()
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] font-semibold text-white">{member.name}</span>
                        <span className="block truncate text-[12px] font-medium text-[color:var(--ui-text-soft)]">
                          {member.role === "owner" ? "Chủ phòng" : "Thành viên"} · {member.email}
                        </span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingMember(member)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-white/10 px-2.5 text-[12px] font-semibold text-[color:var(--ui-accent)] transition hover:bg-white/6"
                    >
                      <UserMinus size={14} /> Gỡ
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassPanel>

        <GlassPanel className="p-5">
          <p className="ui-eyebrow">Nội dung trong phòng</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {Object.entries(room.counts).map(([key, value]) => (
              <div key={key} className="rounded-[10px] border border-white/8 bg-white/[0.03] p-3">
                <p className="text-[12px] font-semibold text-[color:var(--ui-text-soft)]">{countLabels[key] ?? key}</p>
                <p className="text-lg font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      <CosmicModal open={pendingMember !== null} onClose={() => (busy ? undefined : setPendingMember(null))} title="Gỡ thành viên">
        <p className="text-sm font-semibold text-cosmic-mist">
          Gỡ &quot;{pendingMember?.name}&quot; khỏi phòng? Phòng sẽ tự chuyển về trạng thái chờ.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <ActionButton variant="ghost" onClick={() => setPendingMember(null)} disabled={busy}>
            Huỷ
          </ActionButton>
          <ActionButton onClick={confirmRemove} disabled={busy} icon={busy ? <Loader2 size={15} className="animate-spin" /> : undefined}>
            Gỡ thành viên
          </ActionButton>
        </div>
      </CosmicModal>
    </div>
  );
}
