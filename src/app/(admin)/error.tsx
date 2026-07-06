"use client";

import { AlertTriangle } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { GlassPanel } from "@/components/ui/GlassPanel";

export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string; status?: number };
  reset: () => void;
}) {
  const message = error?.message?.trim();

  return (
    <GlassPanel className="p-6">
      <div role="alert" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="mt-1 text-cosmic-gold" aria-hidden="true" />
          <div>
            <h1 className="text-lg font-black text-white">Không tải được dữ liệu quản trị</h1>
            <p className="mt-1 text-sm font-semibold text-cosmic-mist">
              {message && message.length > 0 && message.length < 200
                ? message
                : "Có lỗi xảy ra. Hãy thử tải lại trang."}
            </p>
          </div>
        </div>
        <ActionButton onClick={reset}>Thử lại</ActionButton>
      </div>
    </GlassPanel>
  );
}
