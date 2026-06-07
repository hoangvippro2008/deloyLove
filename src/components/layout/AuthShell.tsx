import type { ReactNode } from "react";
import Link from "next/link";
import { Heart, MessageCircleHeart, ShieldCheck } from "lucide-react";
import { AUTH_BG_PHOTO } from "@/lib/avatars";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="cosmic-page-shell relative min-h-[100dvh] overflow-x-hidden text-white">
      <div className="relative mx-auto grid min-h-[100dvh] w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:px-10">
        <section className="ui-section overflow-hidden p-0 lg:min-h-[680px]">
          <div
            className="relative flex min-h-[360px] flex-1 flex-col justify-between overflow-hidden bg-cover bg-center p-5 sm:p-7 lg:min-h-[520px]"
            style={{ backgroundImage: `linear-gradient(180deg, rgba(7, 8, 23, 0.32), rgba(7, 8, 23, 0.92)), url(${AUTH_BG_PHOTO})` }}
          >
            <Link href="/" className="inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-[#070817]/55 px-3 py-1.5 text-[14px] font-semibold text-white backdrop-blur-md">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--ui-accent-soft)] text-[color:var(--ui-accent)]">
                <Heart size={14} fill="currentColor" aria-hidden="true" />
              </span>
              Cặp đôi đa vũ trụ
            </Link>

            <div className="max-w-2xl">
              <p className="ui-pill mb-4">
                <MessageCircleHeart size={12} aria-hidden="true" />
                Căn phòng riêng cho hai người
              </p>
              <h1 className="ui-h1 max-w-xl text-[clamp(28px,4vw,40px)] leading-[1.1] text-white">
                Vào vũ trụ tình yêu của tụi mình.
              </h1>
              <p className="ui-body mt-4 max-w-xl leading-7 text-[color:var(--ui-text-muted)]">
                Đăng nhập để lưu kỷ niệm, bài hát, lời nhắn, câu hỏi và những điều chỉ hai đứa mình thấy.
              </p>
            </div>
          </div>

          <div className="grid gap-3 border-t border-white/8 p-4 sm:grid-cols-3 sm:p-5">
            {[
              ["Mood", "Hôm nay cậu thế nào"],
              ["Quiz", "Hiểu nhau bằng câu hỏi"],
              ["Album", "Giữ ảnh trong phòng riêng"]
            ].map(([title, text]) => (
              <div key={title} className="ui-card">
                <p className="ui-h3 text-white">{title}</p>
                <p className="ui-caption mt-1 leading-5 text-[color:var(--ui-text-muted)]">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[460px]">
          <div className="ui-pill mb-3">
            <ShieldCheck size={12} aria-hidden="true" />
            Tài khoản dùng để khóa dữ liệu theo phòng riêng
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
