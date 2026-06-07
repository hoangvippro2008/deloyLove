"use client";

import { AlertTriangle, HeartHandshake } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { GlassPanel } from "@/components/ui/GlassPanel";

type DashboardErrorProps = {
  error: Error & { digest?: string; status?: number };
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  const message = error?.message?.trim();
  // 428 = chưa ghép đôi (ensureRoomMember). Bắt theo status hoặc nội dung message tiếng Việt.
  const isUnpaired = error?.status === 428 || /ghép đôi|phòng riêng/i.test(message ?? "");

  if (isUnpaired) {
    return (
      <GlassPanel className="p-6">
        <div
          role="alert"
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <HeartHandshake size={20} className="mt-1 text-cosmic-rose" aria-hidden="true" />
            <div>
              <h1 className="text-lg font-black text-white">Hai bạn chưa ghép đôi</h1>
              <p className="mt-1 text-sm font-semibold text-cosmic-mist">
                Hãy tạo phòng riêng hoặc nhập mã mời của người ấy để bắt đầu vũ trụ của hai người.
              </p>
            </div>
          </div>
          <ActionButton onClick={reset}>Thử lại</ActionButton>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="p-6">
      <div
        role="alert"
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="mt-1 text-cosmic-gold" aria-hidden="true" />
          <div>
            <h1 className="text-lg font-black text-white">Không tải được dữ liệu</h1>
            <p className="mt-1 text-sm font-semibold text-cosmic-mist">
              {message && message.length > 0 && message.length < 200
                ? message
                : "Có vẻ trải nghiệm vừa bị gián đoạn. Hãy thử tải lại trang."}
            </p>
          </div>
        </div>
        <ActionButton onClick={reset}>Thử lại</ActionButton>
      </div>
    </GlassPanel>
  );
}
