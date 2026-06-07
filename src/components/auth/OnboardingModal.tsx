"use client";

import { CalendarDays, HeartHandshake, Image, Sparkles } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { useAuth } from "@/providers/AuthProvider";

const steps = [
  {
    icon: HeartHandshake,
    title: "Tạo hoặc vào phòng",
    text: "Một phòng chỉ có tối đa hai người. Mọi dữ liệu riêng tư đều gắn với phòng này."
  },
  {
    icon: CalendarDays,
    title: "Lịch hẹn chung",
    text: "Đặt lịch, lưu nhắc hẹn và giữ những kế hoạch quan trọng của hai đứa."
  },
  {
    icon: Sparkles,
    title: "Tâm sự mỗi ngày",
    text: "Tạo quiz nhỏ hoặc trả lời câu hỏi để hiểu nhau hơn."
  },
  {
    icon: Image,
    title: "Giữ ảnh riêng",
    text: "Album hoạt động như thư mục ảnh riêng, không có feed công khai."
  }
];

export function OnboardingModal() {
  const { onboardingOpen, completeOnboarding } = useAuth();

  if (!onboardingOpen) {
    return null;
  }

  return (
    <div className="only-modal-backdrop fixed inset-0 z-50 grid place-items-center px-4 py-6">
      <div className="only-modal-card only-pop w-full max-w-4xl p-5 sm:p-6">
        <span className="ui-pill">Hướng dẫn lần đầu</span>
        <div className="mt-3 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <h1 className="ui-h1 text-white">Chào mừng đến Cặp đôi đa vũ trụ</h1>
            <p className="ui-body mt-2 max-w-2xl leading-6 text-[color:var(--ui-text-muted)]">
              Đây là không gian riêng cho hai người, không phải mạng xã hội công khai.
            </p>
          </div>
          <ActionButton onClick={completeOnboarding} variant="primary">
            Tôi đã hiểu
          </ActionButton>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={step.title} className="ui-card">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--ui-radius-sm)] bg-[var(--ui-accent-soft)] text-[color:var(--ui-accent)]">
                    <Icon size={18} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="ui-eyebrow">Bước {index + 1}</p>
                    <h2 className="ui-h3 mt-1 text-white">{step.title}</h2>
                    <p className="ui-body mt-1 leading-6 text-[color:var(--ui-text-muted)]">{step.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
