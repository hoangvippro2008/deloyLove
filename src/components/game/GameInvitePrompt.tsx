"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Gamepad2 } from "lucide-react";
import { CosmicModal } from "@/components/ui/CosmicModal";
import { authRequest } from "@/lib/auth-client";
import { useAuth } from "@/providers/AuthProvider";

type GameLite = {
  status: string;
  inviteFromPartner: boolean;
  mySymbol: "X" | "O" | null;
  xName: string;
  oName: string;
};

// Popup toàn cục: khi đối phương mời chơi, hiện lời mời ở BẤT KỲ trang nào (trừ trang /games tự xử lý).
export function GameInvitePrompt() {
  const { isGuest, status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [invite, setInvite] = useState<GameLite | null>(null);
  const [busy, setBusy] = useState(false);
  const dismissed = useRef(false);

  useEffect(() => {
    if (isGuest || status !== "authenticated") {
      return;
    }

    let active = true;
    const check = async () => {
      try {
        const game = await authRequest<GameLite>("/game");
        if (!active) return;
        if (game.status === "pending" && game.inviteFromPartner) {
          if (!dismissed.current) setInvite(game);
        } else {
          dismissed.current = false;
          setInvite(null);
        }
      } catch {
        // im lặng nếu chưa ghép đôi / lỗi mạng
      }
    };

    void check();
    const timer = window.setInterval(() => {
      if (!document.hidden) void check();
    }, 4000);
    const onVisible = () => {
      if (!document.hidden) void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isGuest, status]);

  if (isGuest || status !== "authenticated" || pathname === "/games" || !invite) {
    return null;
  }

  const partnerName = invite.mySymbol === "X" ? invite.oName : invite.xName;

  const accept = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await authRequest("/game/accept", { method: "POST" });
      setInvite(null);
      router.push("/games");
    } catch {
      // im lặng
    } finally {
      setBusy(false);
    }
  };

  const decline = () => {
    dismissed.current = true;
    setInvite(null);
    void authRequest("/game/decline", { method: "POST" }).catch(() => undefined);
  };

  return (
    <CosmicModal open onClose={decline} title="Lời mời chơi 🎮">
      <div className="grid gap-4 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[var(--ui-accent-soft)] text-[color:var(--ui-accent)]">
          <Gamepad2 size={30} />
        </span>
        <div>
          <p className="text-lg font-black text-white">{partnerName} muốn chơi cờ caro với bạn 🎮</p>
          <p className="ui-body mt-1 text-[color:var(--ui-text-muted)]">Đồng ý để cùng oẳn tù tì xem ai đi trước nhé!</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" className="only-button-primary" disabled={busy} onClick={() => void accept()}>
            Chấp nhận & vào chơi
          </button>
          <button type="button" className="only-button-secondary" onClick={decline}>
            Để sau
          </button>
        </div>
      </div>
    </CosmicModal>
  );
}
