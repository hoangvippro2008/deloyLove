import { Loader2 } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";

export default function AdminLoading() {
  return (
    <GlassPanel className="p-6">
      <div role="status" aria-live="polite" className="flex items-center gap-3 text-sm font-extrabold text-cosmic-mist">
        <Loader2 size={18} className="animate-spin text-cosmic-rose motion-reduce:animate-none" aria-hidden="true" />
        Đang tải dữ liệu quản trị…
      </div>
    </GlassPanel>
  );
}
