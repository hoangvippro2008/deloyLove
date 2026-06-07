"use client";

import { useEffect, useState } from "react";
import { Music2, Pause, Play, X } from "lucide-react";
import { cn } from "@/lib/cn";

// Nhạc nền Lo-fi cho phòng riêng: bật/tắt + nhúng link YouTube/SoundCloud.
// Lưu lựa chọn ở localStorage (theo máy). Chỉ hiển thị trong phòng (DashboardShell).
const STORAGE_KEY = "cosmic_room_music";
const DEFAULT_URL = "https://www.youtube.com/watch?v=jfKfPfyJRdk"; // Lofi Girl

type MusicState = { url: string; playing: boolean };

function toEmbed(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl.trim());
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = url.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&loop=1&playlist=${id}`;
      const embed = url.pathname.match(/\/embed\/([^/?]+)/);
      if (embed) return `https://www.youtube.com/embed/${embed[1]}?autoplay=1&loop=1&playlist=${embed[1]}`;
    }
    if (host === "youtu.be") {
      const id = url.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&loop=1&playlist=${id}`;
    }
    if (host.endsWith("soundcloud.com")) {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(rawUrl)}&auto_play=true&visual=false`;
    }
    return null;
  } catch {
    return null;
  }
}

export function RoomMusic() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [music, setMusic] = useState<MusicState>({ url: DEFAULT_URL, playing: false });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const data = JSON.parse(saved) as Partial<MusicState>;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- khôi phục lựa chọn nhạc đã lưu khi mount
      setMusic((prev) => ({ url: data.url ?? prev.url, playing: data.playing ?? prev.playing }));
    } catch {
      // bỏ qua nếu localStorage lỗi
    }
  }, []);

  const update = (next: MusicState) => {
    setMusic(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // bỏ qua
    }
  };

  const togglePlay = () => update({ ...music, playing: !music.playing });

  const applyDraft = () => {
    const value = draft.trim();
    if (!value || !toEmbed(value)) {
      return; // link rỗng hoặc không hợp lệ -> bỏ qua
    }
    update({ url: value, playing: true });
    setDraft("");
  };

  const embed = music.playing ? toEmbed(music.url) : null;

  return (
    <>
      {embed ? (
        <iframe
          title="Nhạc nền phòng"
          src={embed}
          allow="autoplay; encrypted-media"
          className="pointer-events-none fixed bottom-0 right-0 h-1 w-1 opacity-0"
          aria-hidden="true"
        />
      ) : null}

      <div className="fixed bottom-20 right-4 z-40 lg:bottom-6">
        {open ? (
          <div className="mb-2 w-72 rounded-2xl border border-white/12 bg-[#0e1024]/92 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-md">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-extrabold text-white">Nhạc nền phòng</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="text-white/70 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <p className="mt-1 text-[11.5px] text-[color:var(--ui-text-soft)]">
              {music.playing ? "Đang phát một bản lo-fi nhẹ nhàng 🎧" : "Bật một bản lo-fi cho căn phòng."}
            </p>
            <button type="button" onClick={togglePlay} className="only-button-primary mt-3 w-full">
              {music.playing ? <Pause size={16} /> : <Play size={16} />}
              {music.playing ? "Tạm dừng" : "Phát nhạc"}
            </button>
            <div className="mt-3 grid gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Dán link YouTube / SoundCloud"
                className="only-field text-[13px]"
                aria-label="Link nhạc YouTube hoặc SoundCloud"
              />
              <button type="button" onClick={applyDraft} className="only-button-secondary w-full text-[13px]">
                Dùng link này
              </button>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Nhạc nền phòng"
          className={cn(
            "grid h-12 w-12 place-items-center rounded-full border border-white/14 bg-[#0e1024]/92 text-white shadow-[0_12px_30px_rgba(0,0,0,0.4)] backdrop-blur-md transition hover:border-[rgba(255,150,200,0.5)]",
            music.playing && "animate-pulse text-[color:var(--ui-accent)]"
          )}
        >
          <Music2 size={20} />
        </button>
      </div>
    </>
  );
}
