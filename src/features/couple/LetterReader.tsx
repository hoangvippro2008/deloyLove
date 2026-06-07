"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { LetterPaper } from "@/features/couple/LetterPaper";
import type { CoupleLetter } from "@/features/couple/letter-types";

type LetterReaderProps = {
  open: boolean;
  letter: CoupleLetter | null;
  now: number;
  onClose: () => void;
  footer?: ReactNode;
};

// Đọc thư như một bức thư thật: chỉ tờ thư + nắp tam giác phía trên + nút đóng — không khung nền.
export function LetterReader({ open, letter, now, onClose, footer }: LetterReaderProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // khoá scroll nền khi mở thư
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !letter) {
    return null;
  }

  return (
    <div
      className="only-modal-backdrop fixed inset-0 z-50 grid place-items-center px-4 py-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Lá thư"
    >
      <div className="relative w-full max-w-[520px]" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          className="absolute -right-2 -top-2 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-[#1a1430]/85 text-white backdrop-blur-sm transition hover:bg-[#1a1430]"
        >
          <X size={16} aria-hidden="true" />
        </button>

        <div className="letter-flap" aria-hidden="true" />
        <LetterPaper letter={letter} now={now} />

        {footer ? <div className="mt-3 flex justify-end">{footer}</div> : null}
      </div>
    </div>
  );
}
