"use client";

import { cn } from "@/lib/cn";
import type { CoupleLetter } from "@/features/couple/letter-types";

// Định dạng thời điểm mở thư bí mật (vd: 20:30 31/12/2026)
function formatUnlock(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

// Ngày viết thư (vd: 30/05/2026)
function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

type LetterPaperProps = {
  letter: CoupleLetter;
  now: number; // mốc thời gian hiện tại (truyền vào để giữ render thuần, không gọi Date.now() khi render)
};

// Tờ giấy thư khi mở: nếu là thư bí mật chưa tới ngày mở thì hiện trạng thái khoá,
// ngược lại trình bày như một bức thư thật (ngày, lời chào, thân thư, lời kết, chữ ký).
export function LetterPaper({ letter, now }: LetterPaperProps) {
  const locked = Boolean(letter.isSecret && letter.unlockAt && new Date(letter.unlockAt).getTime() > now);

  if (locked) {
    return (
      <div className="letter-paper letter-paper-cream letter-open text-center">
        <p className="text-3xl">🔒</p>
        <p className="mt-2 font-bold">Thư bí mật đang được giữ kín</p>
        <p className="mt-1 text-sm">Sẽ mở vào {formatUnlock(letter.unlockAt as string)}</p>
      </div>
    );
  }

  const dateLabel = letter.createdAt ? formatDate(letter.createdAt) : null;

  return (
    <article
      className={cn(
        "letter-paper letter-sheet letter-open",
        `letter-paper-${letter.paper ?? "cream"}`,
        `letter-font-${letter.font ?? "hand"}`
      )}
    >
      <div className="letter-sheet__meta">
        <span className="letter-sheet__mood">{letter.mood ? `“${letter.mood}”` : "Lời nhắn"}</span>
        {dateLabel ? <span>{dateLabel}</span> : null}
      </div>

      <p className="letter-sheet__greeting">Gửi {letter.receiverName ?? "người ấy"} thương,</p>
      <p className="letter-sheet__body">{letter.content}</p>

      <div className="letter-sheet__close">
        <p className="letter-sheet__signoff">Thương nhiều,</p>
        <p className="letter-sheet__sign">— {letter.senderName ?? "Người ấy"}</p>
      </div>
    </article>
  );
}
