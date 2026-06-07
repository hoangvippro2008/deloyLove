"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Crown, Gamepad2, HeartHandshake, Loader2, Swords, Trophy } from "lucide-react";
import { ApiClientError } from "@/lib/api-client";
import { authRequest } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { useAuth } from "@/providers/AuthProvider";

type Rps = "R" | "P" | "S";

type GameState = {
  board: ("X" | "O" | null)[];
  turn: "X" | "O";
  status: "idle" | "pending" | "rps" | "playing" | "won" | "draw";
  winner: "X" | "O" | null;
  round: number;
  mySymbol: "X" | "O" | null;
  yourTurn: boolean;
  invitedByMe: boolean;
  inviteFromPartner: boolean;
  rps: {
    xPicked: boolean;
    oPicked: boolean;
    myChoice: Rps | null;
    revealed: boolean;
    x: Rps | null;
    o: Rps | null;
    firstSymbol: "X" | "O" | null;
  };
  scores: { x: number; o: number; draws: number };
  xName: string;
  oName: string;
};

const RPS_LABELS: Record<Rps, { img: string; label: string }> = {
  R: { img: "/game/bua.svg", label: "Búa" },
  P: { img: "/game/bao.svg", label: "Bao" },
  S: { img: "/game/keo.svg", label: "Kéo" }
};

function GameShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl text-white">
      <header className="ui-section flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[var(--ui-accent-soft)] text-[color:var(--ui-accent)]">
          <Gamepad2 size={20} />
        </span>
        <div className="min-w-0">
          <p className="ui-eyebrow">Trò chơi đôi mình</p>
          <h1 className="ui-h2 text-white">Cờ caro</h1>
        </div>
      </header>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function CoupleGamePage() {
  const { isGuest, openAuth, status } = useAuth();
  const [game, setGame] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [needRoom, setNeedRoom] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"play" | "rank">("play");
  const [revealStep, setRevealStep] = useState<number | null>(null);
  const revealedRoundRef = useRef(0);
  const gameRef = useRef<GameState | null>(null);

  useEffect(() => {
    if (status === "checking") {
      return;
    }
    if (status !== "authenticated") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- guest thì dừng loading ngay (cố ý)
      setLoading(false);
      return;
    }

    let active = true;
    const load = async () => {
      try {
        const data = await authRequest<GameState>("/game");
        if (!active) return;
        setGame(data);
        setNeedRoom(false);
      } catch (error) {
        if (active && error instanceof ApiClientError && error.status === 428) {
          setNeedRoom(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    const timer = window.setInterval(() => {
      if (!document.hidden) void load();
    }, 2500);
    const onVisible = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [status]);

  // Khi vào ván mới (đã oẳn tù tì xong) -> bật hiệu ứng đếm 3-2-1 rồi lộ kết quả
  useEffect(() => {
    if (
      game &&
      game.status === "playing" &&
      game.rps.revealed &&
      game.rps.firstSymbol &&
      game.board.every((cell) => cell === null) &&
      revealedRoundRef.current !== game.round
    ) {
      revealedRoundRef.current = game.round;
      setRevealStep(3);
    }
  }, [game]);

  useEffect(() => {
    if (revealStep === null) {
      return;
    }
    const timer = window.setTimeout(
      () => setRevealStep((step) => (step === null ? null : step > 0 ? step - 1 : null)),
      revealStep > 0 ? 800 : 1800
    );
    return () => window.clearTimeout(timer);
  }, [revealStep]);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // Rời trang / tải lại web giữa ván đang chơi = bỏ cuộc, xử thua (gửi kèm keepalive để sống qua lúc unload)
  useEffect(() => {
    const handleLeave = () => {
      const current = gameRef.current;
      if (current && current.status === "playing" && current.mySymbol) {
        void authRequest("/game/surrender", { method: "POST", keepalive: true }).catch(() => undefined);
      }
    };
    window.addEventListener("pagehide", handleLeave);
    return () => window.removeEventListener("pagehide", handleLeave);
  }, []);

  async function act(path: string, body?: unknown) {
    if (busy) return;
    setBusy(true);
    try {
      const data = await authRequest<GameState>(path, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined
      });
      setGame(data);
    } catch {
      // im lặng — vòng poll sẽ đồng bộ lại
    } finally {
      setBusy(false);
    }
  }

  if (isGuest) {
    return (
      <GameShell>
        <section className="ui-section text-center">
          <p className="ui-body text-[color:var(--ui-text-muted)]">Đăng nhập để chơi cùng người ấy.</p>
          <button type="button" className="only-button-primary mx-auto mt-4" onClick={openAuth}>
            Đăng nhập
          </button>
        </section>
      </GameShell>
    );
  }

  if (loading) {
    return (
      <GameShell>
        <div className="ui-section inline-flex items-center gap-3 text-sm font-extrabold">
          <Loader2 className="animate-spin text-[color:var(--ui-accent)]" size={18} /> Đang vào sảnh...
        </div>
      </GameShell>
    );
  }

  if (needRoom || !game) {
    return (
      <GameShell>
        <section className="ui-section text-center">
          <h2 className="ui-h3 text-white">Cần ghép đôi trước đã</h2>
          <p className="ui-body mt-1 text-[color:var(--ui-text-muted)]">Tạo hoặc tham gia phòng riêng để chơi cùng người ấy nhé.</p>
        </section>
      </GameShell>
    );
  }

  const partnerName = game.mySymbol === "X" ? game.oName : game.mySymbol === "O" ? game.xName : "Người ấy";
  const winnerName = game.winner === "X" ? game.xName : game.winner === "O" ? game.oName : null;
  const turnName = game.turn === "X" ? game.xName : game.oName;
  const firstName = game.rps.firstSymbol === "X" ? game.xName : game.oName;
  const totalGames = game.scores.x + game.scores.o + game.scores.draws;
  const leader = game.scores.x > game.scores.o ? "X" : game.scores.o > game.scores.x ? "O" : null;
  const revealing =
    game.status === "playing" && revealStep !== null && game.rps.x !== null && game.rps.o !== null && game.rps.firstSymbol !== null;
  const needsMyAction =
    game.inviteFromPartner || (game.status === "rps" && !game.rps.myChoice) || (game.status === "playing" && game.yourTurn);

  const renderBoard = (interactive: boolean) => (
    <div className="mx-auto mt-4 grid max-w-[340px] grid-cols-3 gap-2.5">
      {game.board.map((cell, index) => {
        const playable = interactive && game.yourTurn && cell === null && game.status === "playing" && !busy;
        return (
          <button
            key={index}
            type="button"
            disabled={!playable}
            onClick={() => void act("/game/move", { index })}
            aria-label={`Ô ${index + 1}`}
            className={cn(
              "grid aspect-square place-items-center rounded-[14px] border border-white/10 bg-white/[0.04] text-4xl font-black transition",
              playable ? "cursor-pointer hover:border-[color:var(--ui-accent)] hover:bg-white/[0.08]" : "cursor-default",
              cell === "X" && "text-[color:var(--ui-accent)]",
              cell === "O" && "text-sky-300"
            )}
          >
            {cell ?? ""}
          </button>
        );
      })}
    </div>
  );

  const playerChip = (symbol: "X" | "O", name: string) => (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-bold transition",
        game.turn === symbol && game.status === "playing"
          ? symbol === "X"
            ? "bg-[var(--ui-accent-soft)] text-[color:var(--ui-accent)] ring-1 ring-[color:var(--ui-accent)]"
            : "bg-sky-400/15 text-sky-200 ring-1 ring-sky-300"
          : "bg-white/6 text-white"
      )}
    >
      <span className={symbol === "X" ? "font-black text-[color:var(--ui-accent)]" : "font-black text-sky-300"}>{symbol}</span> {name}
    </span>
  );

  let playView: ReactNode;
  if (revealing) {
    // Hiệu ứng đếm 3-2-1 rồi lộ kết quả oẳn tù tì
    playView = (
      <section className="ui-section text-center">
        <p className="ui-eyebrow">Oẳn tù tì</p>
        {revealStep && revealStep > 0 ? (
          <motion.p
            key={revealStep}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="my-10 text-7xl font-black text-[color:var(--ui-accent)]"
          >
            {revealStep}
          </motion.p>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="my-7">
            <div className="flex items-center justify-center gap-8">
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={RPS_LABELS[game.rps.x as Rps].img} alt="" className="mx-auto h-16 w-16" />
                <p className="mt-2 text-sm font-bold text-[color:var(--ui-accent)]">{game.xName}</p>
              </div>
              <span className="text-2xl text-[color:var(--ui-text-soft)]">vs</span>
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={RPS_LABELS[game.rps.o as Rps].img} alt="" className="mx-auto h-16 w-16" />
                <p className="mt-2 text-sm font-bold text-sky-300">{game.oName}</p>
              </div>
            </div>
            <p className="mt-6 text-xl font-black text-white">{firstName} đi trước! 🎉</p>
          </motion.div>
        )}
      </section>
    );
  } else if (game.status === "rps") {
    playView = (
      <section className="ui-section text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[var(--ui-accent-soft)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/game/bua.svg" alt="" className="h-9 w-9" />
        </span>
        <p className="mt-4 text-lg font-black text-white">Oẳn tù tì xem ai đi trước!</p>
        {game.rps.myChoice ? (
          <>
            <p className="ui-body mt-1 text-[color:var(--ui-text-muted)]">
              Bạn đã chọn{" "}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={RPS_LABELS[game.rps.myChoice].img} alt="" className="inline h-5 w-5 align-text-bottom" />{" "}
              <b className="text-white">{RPS_LABELS[game.rps.myChoice].label}</b>
            </p>
            <p className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[color:var(--ui-accent)]">
              <Loader2 className="animate-spin" size={16} /> Đợi {partnerName} chọn...
            </p>
          </>
        ) : (
          <>
            <p className="ui-caption mt-1 text-[color:var(--ui-text-soft)]">Búa thắng Kéo · Kéo thắng Bao · Bao thắng Búa</p>
            <div className="mx-auto mt-5 grid max-w-sm grid-cols-3 gap-3">
              {(["R", "P", "S"] as const).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  disabled={busy}
                  onClick={() => void act("/game/rps", { choice })}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] py-4 transition hover:-translate-y-0.5 hover:border-[color:var(--ui-accent)] hover:bg-white/[0.08]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={RPS_LABELS[choice].img} alt={RPS_LABELS[choice].label} className="h-12 w-12" />
                  <span className="text-[13px] font-bold text-white">{RPS_LABELS[choice].label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    );
  } else if (game.status === "pending" && game.inviteFromPartner) {
    playView = (
      <section className="ui-section text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[var(--ui-accent-soft)] text-[color:var(--ui-accent)]">
          <HeartHandshake size={28} />
        </span>
        <p className="mt-4 text-lg font-black text-white">{partnerName} muốn chơi cờ caro 🎮</p>
        <p className="ui-body mt-1 text-[color:var(--ui-text-muted)]">Đồng ý để cùng oẳn tù tì xem ai đi trước.</p>
        <div className="mx-auto mt-5 grid max-w-sm gap-2 sm:grid-cols-2">
          <button type="button" className="only-button-primary" disabled={busy} onClick={() => void act("/game/accept")}>
            Chấp nhận
          </button>
          <button type="button" className="only-button-secondary" disabled={busy} onClick={() => void act("/game/decline")}>
            Từ chối
          </button>
        </div>
      </section>
    );
  } else if (game.status === "pending" && game.invitedByMe) {
    playView = (
      <section className="ui-section text-center">
        <Loader2 className="mx-auto animate-spin text-[color:var(--ui-accent)]" size={28} />
        <p className="mt-4 text-lg font-black text-white">Đang chờ {partnerName} đồng ý...</p>
        <p className="ui-body mt-1 text-[color:var(--ui-text-muted)]">Khi {partnerName} bấm chấp nhận, hai đứa oẳn tù tì rồi vào bàn.</p>
        <button type="button" className="only-button-secondary mx-auto mt-5" disabled={busy} onClick={() => void act("/game/decline")}>
          Huỷ lời mời
        </button>
      </section>
    );
  } else if (game.status === "playing") {
    playView = (
      <section className="ui-section">
        <div className="flex items-center justify-center gap-3">
          {playerChip("X", game.xName)}
          <span className="text-[color:var(--ui-text-soft)]">vs</span>
          {playerChip("O", game.oName)}
        </div>
        <p className="mt-4 text-center text-[15px] font-extrabold text-white">
          {game.yourTurn ? "Tới lượt bạn ✨" : `Đang đợi ${turnName}...`}
        </p>
        {renderBoard(true)}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void act("/game/surrender")}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-[13px] font-bold text-white/65 transition hover:border-rose-300/40 hover:bg-white/8 hover:text-rose-200"
          >
            🏳️ Đầu hàng
          </button>
          <span className="ui-caption text-[color:var(--ui-text-soft)]">Ván #{game.round}</span>
        </div>
      </section>
    );
  } else {
    const resultText =
      game.status === "won"
        ? game.winner === game.mySymbol
          ? "Bạn thắng rồi! 🎉"
          : `${winnerName} thắng! 💗`
        : game.status === "draw"
          ? "Hoà rồi 🤝"
          : null;

    playView = (
      <section className="ui-section text-center">
        {resultText ? (
          <>
            {renderBoard(false)}
            <p className="mt-4 text-lg font-black text-white">{resultText}</p>
          </>
        ) : (
          <>
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[var(--ui-accent-soft)] text-[color:var(--ui-accent)]">
              <Swords size={28} />
            </span>
            <p className="mt-4 text-lg font-black text-white">Rủ {partnerName} chơi một ván cờ caro?</p>
            <p className="ui-body mt-1 text-[color:var(--ui-text-muted)]">Gửi lời mời — khi {partnerName} đồng ý, hai đứa oẳn tù tì xem ai đi trước.</p>
          </>
        )}
        <button type="button" className="only-button-primary mx-auto mt-5" disabled={busy} onClick={() => void act("/game/invite")}>
          <Gamepad2 size={16} /> {resultText ? "Chơi ván mới" : "Mời chơi"}
        </button>
      </section>
    );
  }

  const rankView = (
    <section className="ui-section">
      <div className="flex items-center justify-between">
        <h2 className="ui-h3 text-white">Bảng xếp hạng</h2>
        <span className="ui-caption text-[color:var(--ui-text-soft)]">{totalGames} ván đã đấu</span>
      </div>
      <div className="mt-4 grid gap-2.5">
        {(
          [
            { symbol: "X" as const, name: game.xName, wins: game.scores.x, tone: "text-[color:var(--ui-accent)]" },
            { symbol: "O" as const, name: game.oName, wins: game.scores.o, tone: "text-sky-300" }
          ]
        ).map((player) => (
          <div key={player.symbol} className="ui-card flex items-center gap-3">
            <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/8 text-lg font-black", player.tone)}>
              {player.symbol}
            </span>
            <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-white">
              {player.name}
              {leader === player.symbol ? <Crown size={15} className="ml-1.5 inline text-amber-300" /> : null}
            </span>
            <span className="shrink-0 text-2xl font-black text-white">
              {player.wins}
              <span className="ml-1 text-[12px] font-semibold text-[color:var(--ui-text-soft)]">thắng</span>
            </span>
          </div>
        ))}
        <div className="ui-card flex items-center justify-center gap-2 text-[13px] font-bold text-[color:var(--ui-text-muted)]">
          <span className="text-lg">🤝</span> Hoà nhau: {game.scores.draws} ván
        </div>
      </div>
      <p className="ui-caption mt-4 text-center text-[color:var(--ui-text-soft)]">
        {leader ? `${leader === "X" ? game.xName : game.oName} đang dẫn đầu 👑` : "Chưa phân thắng bại — chơi tiếp nào!"}
      </p>
    </section>
  );

  const tabButton = (key: "play" | "rank", label: string, Icon: typeof Swords, dot: boolean) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      className={cn(
        "relative inline-flex min-h-10 items-center justify-center gap-2 rounded-[9px] text-sm font-semibold transition",
        tab === key ? "bg-white/14 text-white" : "text-[color:var(--ui-text-muted)] hover:bg-white/8 hover:text-white"
      )}
    >
      <Icon size={15} /> {label}
      {dot ? <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-[color:var(--ui-accent)]" /> : null}
    </button>
  );

  return (
    <GameShell>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-1 rounded-[12px] border border-white/10 bg-white/[0.05] p-1">
          {tabButton("play", "Bàn cờ", Swords, needsMyAction)}
          {tabButton("rank", "Bảng xếp hạng", Trophy, false)}
        </div>
        {tab === "play" ? playView : rankView}
      </div>
    </GameShell>
  );
}
