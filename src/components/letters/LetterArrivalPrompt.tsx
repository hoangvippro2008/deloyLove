"use client";

import { useEffect, useRef, useState } from "react";
import { HeartHandshake, Mail } from "lucide-react";
import { CosmicModal } from "@/components/ui/CosmicModal";
import { LetterReader } from "@/features/couple/LetterReader";
import type { CoupleLetter } from "@/features/couple/letter-types";
import { authRequest } from "@/lib/auth-client";
import { useAuth } from "@/providers/AuthProvider";

// Hỏi mở thư khi người NHẬN vào web: nếu có lá thư từ người ấy mà mình chưa mở
// (và không phải thư bí mật còn khoá) thì hiện modal "Bạn có muốn mở thư không?".
// Bấm "Mở thư" -> đánh dấu đã mở + hiện nội dung ngay. Bấm "Để sau" -> ẩn trong phiên này.
export function LetterArrivalPrompt() {
  const { user, isGuest, status } = useAuth();
  const [pending, setPending] = useState<CoupleLetter | null>(null);
  const [reading, setReading] = useState<CoupleLetter | null>(null);
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState(false);
  const dismissed = useRef<Set<string>>(new Set()); // các thư đã bấm "Để sau" trong phiên
  const active = useRef(false); // đang hiển thị một modal (hỏi hoặc đọc) -> tạm dừng dò thư mới

  useEffect(() => {
    if (isGuest || status !== "authenticated" || !user?.id) {
      return;
    }

    const userId = user.id;

    // Dò thư chưa mở từ người ấy; tạm dừng khi đang hiển thị một modal.
    const check = async () => {
      if (active.current) {
        return;
      }

      try {
        const letters = await authRequest<CoupleLetter[]>("/letters");
        const ts = Date.now();
        const next = letters.find(
          (letter) =>
            letter.senderId !== userId &&
            !letter.isOpened &&
            !dismissed.current.has(letter.id) &&
            !(letter.isSecret && letter.unlockAt && new Date(letter.unlockAt).getTime() > ts)
        );

        if (next) {
          active.current = true;
          setNow(ts);
          setPending(next);
        }
      } catch {
      }
    };

    void check();
    const timer = window.setInterval(() => {
      if (!document.hidden) {
        void check();
      }
    }, 30000);
    return () => window.clearInterval(timer);
  }, [isGuest, status, user?.id]);

  if (isGuest || status !== "authenticated") {
    return null;
  }

  const openNow = async () => {
    if (!pending || busy) {
      return;
    }

    setBusy(true);
    const letter = pending;
    try {
      await authRequest(`/letters/${letter.id}/open`, { method: "PATCH" });
    } catch {
      // nội dung đã có sẵn nên vẫn cho đọc dù đánh dấu lỗi
    } finally {
      setBusy(false);
      setPending(null);
      setReading(letter); // vẫn giữ active.current = true cho tới khi đóng màn đọc
    }
  };

  const later = () => {
    if (pending) {
      dismissed.current.add(pending.id);
    }
    setPending(null);
    active.current = false;
  };

  const closeReading = () => {
    setReading(null);
    active.current = false;
  };

  return (
    <>
      <CosmicModal open={Boolean(pending)} onClose={later} title="Bạn có một lá thư 💌">
        {pending ? (
          <div className="grid gap-4 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-[14px] bg-[var(--ui-accent-soft)] text-[color:var(--ui-accent)]">
              <Mail size={30} />
            </span>
            <div>
              <p className="text-lg font-black text-white">
                {pending.senderName ?? "Người ấy"} vừa gửi cho bạn một lá thư
              </p>
              <p className="ui-body mt-1 text-[color:var(--ui-text-muted)]">Bạn có muốn mở thư không?</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" className="only-button-primary" disabled={busy} onClick={() => void openNow()}>
                <HeartHandshake size={18} /> Mở thư
              </button>
              <button type="button" className="only-button-secondary" onClick={later}>
                Để sau
              </button>
            </div>
          </div>
        ) : null}
      </CosmicModal>

      <LetterReader open={Boolean(reading)} letter={reading} now={now} onClose={closeReading} />
    </>
  );
}
