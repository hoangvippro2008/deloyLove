"use client";

import { useState } from "react";
import { Loader2, Megaphone, Send } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { CosmicModal } from "@/components/ui/CosmicModal";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/ToastProvider";
import { adminBroadcast } from "@/lib/admin-client";
import { AdminPageHeader } from "@/features/admin/components/AdminUI";

export function AdminBroadcastPage() {
  const { notify } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      const result = await adminBroadcast({ title: title.trim(), content: content.trim() || undefined });
      notify({ title: "Đã gửi thông báo", message: `Tới ${result.recipients} người dùng.`, tone: "success" });
      setTitle("");
      setContent("");
      setConfirmOpen(false);
    } catch (err) {
      notify({ title: "Không gửi được", message: err instanceof Error ? err.message : "Có lỗi xảy ra", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Thông báo hệ thống"
        description="Gửi một thông báo tới tất cả người dùng đang trong phòng. Họ sẽ thấy ở chuông thông báo."
      />

      <GlassPanel className="max-w-2xl p-5">
        <div className="grid gap-3">
          <TextField
            label="Tiêu đề"
            leftIcon={<Megaphone size={15} />}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ví dụ: Cập nhật tính năng mới"
          />
          <label className="text-[13px] font-semibold text-cosmic-mist">
            Nội dung (tuỳ chọn)
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={4}
              className="mt-1 w-full rounded-[10px] border border-white/12 bg-white/5 px-3 py-2 text-[14px] font-semibold text-white"
              placeholder="Chi tiết thông báo…"
            />
          </label>
          <div className="flex justify-end">
            <ActionButton
              icon={<Send size={15} />}
              onClick={() => setConfirmOpen(true)}
              disabled={title.trim().length < 2}
            >
              Gửi thông báo
            </ActionButton>
          </div>
        </div>
      </GlassPanel>

      <CosmicModal open={confirmOpen} onClose={() => (busy ? undefined : setConfirmOpen(false))} title="Xác nhận gửi">
        <p className="text-sm font-semibold text-cosmic-mist">
          Gửi thông báo &quot;{title.trim()}&quot; tới tất cả người dùng đang trong phòng?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <ActionButton variant="ghost" onClick={() => setConfirmOpen(false)} disabled={busy}>
            Huỷ
          </ActionButton>
          <ActionButton onClick={send} disabled={busy} icon={busy ? <Loader2 size={15} className="animate-spin" /> : undefined}>
            Gửi
          </ActionButton>
        </div>
      </CosmicModal>
    </div>
  );
}
