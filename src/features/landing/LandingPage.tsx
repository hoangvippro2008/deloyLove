"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  CalendarHeart,
  Flame,
  Heart,
  ImagePlus,
  KeyRound,
  Mail,
  MessageCircle,
  Music2,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { authRequest } from "@/lib/auth-client";
import { COUPLE_PHOTOS, pickFallbackAvatar } from "@/lib/avatars";
import { useAuth } from "@/providers/AuthProvider";

const features = [
  { icon: CalendarHeart, title: "Kỷ niệm", text: "Lưu ngày đáng nhớ, ảnh và lời kể chỉ hai người xem." },
  { icon: Mail, title: "Lời nhắn", text: "Viết thư tay, gửi nhau lời yêu thương ngọt ngào." },
  { icon: CalendarDays, title: "Lịch hẹn", text: "Lên lịch hẹn hò, nhắc ngày quan trọng của hai đứa." },
  { icon: ImagePlus, title: "Album ảnh", text: "Kho ảnh riêng tư, gom theo từng thư mục kỷ niệm." },
  { icon: Music2, title: "Playlist chung", text: "Gửi nhau một bài hát kèm lời nhắn nhỏ." },
  { icon: MessageCircle, title: "Tâm sự", text: "Mỗi ngày một câu hỏi để hiểu nhau hơn." },
  { icon: Flame, title: "Thử thách", text: "Thử thách 30 ngày, cùng nhau giữ chuỗi streak." }
];

const heroPhoto = COUPLE_PHOTOS[0];
const partnerPhoto = COUPLE_PHOTOS[1];
const memoryPhoto = COUPLE_PHOTOS[2];
const heroAvatarA = pickFallbackAvatar("landing-hero-a");
const heroAvatarB = pickFallbackAvatar("landing-hero-b");

export function LandingPage() {
  const { isGuest, status } = useAuth();
  const [now, setNow] = useState(() => Date.now());
  const [anniversary, setAnniversary] = useState<number | null>(null);
  const [bucketCount, setBucketCount] = useState<number | null>(null);

  // Đồng hồ đếm realtime (cập nhật mỗi giây)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Khi đã đăng nhập: lấy ngày yêu nhau + số việc muốn làm thật
  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let active = true;
    void authRequest<{ anniversaryDate: string | null }>("/room")
      .then((room) => {
        if (active && room?.anniversaryDate) {
          setAnniversary(new Date(room.anniversaryDate).getTime());
        }
      })
      .catch(() => undefined);
    void authRequest<unknown[]>("/bucket-list")
      .then((items) => {
        if (active) {
          setBucketCount(Array.isArray(items) ? items.length : 0);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [status]);

  const elapsed = anniversary ? Math.max(0, now - anniversary) : null;
  const loveDays = elapsed != null ? Math.floor(elapsed / 86_400_000) : null;
  const loveHours = elapsed != null ? Math.floor((elapsed % 86_400_000) / 3_600_000) : 0;
  const loveMinutes = elapsed != null ? Math.floor((elapsed % 3_600_000) / 60_000) : 0;
  const loveSeconds = elapsed != null ? Math.floor((elapsed % 60_000) / 1000) : 0;
  const pad = (value: number) => String(value).padStart(2, "0");
  const ctaHref = isGuest ? "/login" : "/dashboard";
  const ctaHint = isGuest ? "đăng nhập để bắt đầu" : "thiết lập phòng đôi";

  return (
    <main className="cosmic-page-shell min-h-[100dvh] overflow-x-hidden text-white">
      {/* Hero */}
      <section className="relative mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <div className="grid items-center gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <p className="ui-pill">
              <Heart size={12} className="text-[color:var(--ui-accent)]" /> Vũ trụ tình yêu cho cặp đôi
            </p>
            <h1 className="mt-5 max-w-3xl text-[clamp(34px,5vw,52px)] font-bold leading-[1.08] text-white">
              Một căn phòng nhỏ,<br className="hidden sm:block" /> chỉ riêng của hai đứa.
            </h1>
            <p className="ui-body mt-5 max-w-xl text-[15px] leading-7 text-[color:var(--ui-text-muted)]">
              Lưu kỷ niệm, lên lịch hẹn, gửi nhau lời nhắn và cùng xem phim trong một không gian chỉ hai người mới có chìa khóa.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard" className="only-button-primary">
                Bắt đầu hành trình
                <Sparkles size={16} />
              </Link>
              <Link href="/login" className="only-button-secondary">
                <KeyRound size={16} />
                Tạo không gian đôi
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, delay: 0.08 }} className="relative">
            <div className="ui-section">
              <div className="relative overflow-hidden rounded-[var(--ui-radius-md)] border border-white/8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroPhoto} alt="Khoảnh khắc cặp đôi" className="h-64 w-full object-cover sm:h-72" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06081d]/90 via-[#06081d]/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="ui-eyebrow">Phòng riêng</p>
                      <h2 className="ui-h2 mt-1 text-white">Nhà nhỏ của hai ta</h2>
                    </div>
                    <div className="flex -space-x-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={heroAvatarA} alt="Avatar 1" className="h-10 w-10 rounded-full border-2 border-[#08091f] object-cover" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={heroAvatarB} alt="Avatar 2" className="h-10 w-10 rounded-full border-2 border-[#08091f] object-cover" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 grid gap-3">
                <div className="ui-card">
                  <p className="ui-eyebrow">Câu hỏi hôm nay</p>
                  <p className="ui-h3 mt-2 text-white">Hôm nay cậu cần tớ ở cạnh theo cách nào?</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="overflow-hidden rounded-[var(--ui-radius-md)] border border-white/8">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={partnerPhoto} alt="Khoảnh khắc bên nhau" className="h-20 w-full object-cover" />
                    <div className="p-3">
                      {loveDays != null ? (
                        <>
                          <p className="ui-stat-num text-white">{loveDays}</p>
                          <p className="ui-stat-label text-[color:var(--ui-text-soft)]">ngày bên nhau</p>
                          <p className="mt-0.5 text-[11px] font-bold tabular-nums text-[color:var(--ui-accent)]">
                            {pad(loveHours)}:{pad(loveMinutes)}:{pad(loveSeconds)}
                          </p>
                        </>
                      ) : (
                        <>
                          <Link
                            href={ctaHref}
                            className="inline-flex items-center gap-1.5 text-[16px] font-extrabold text-[color:var(--ui-accent)] transition hover:gap-2.5"
                          >
                            Tiến tới ngay <ArrowRight size={15} />
                          </Link>
                          <p className="ui-stat-label mt-0.5 text-[color:var(--ui-text-soft)]">{ctaHint}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-[var(--ui-radius-md)] border border-white/8">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={memoryPhoto} alt="Điều muốn làm" className="h-20 w-full object-cover" />
                    <div className="p-3">
                      {bucketCount != null ? (
                        <>
                          <p className="ui-stat-num text-white">{bucketCount}</p>
                          <p className="ui-stat-label text-[color:var(--ui-text-soft)]">việc muốn làm</p>
                        </>
                      ) : (
                        <>
                          <Link
                            href={ctaHref}
                            className="inline-flex items-center gap-1.5 text-[16px] font-extrabold text-[color:var(--ui-accent)] transition hover:gap-2.5"
                          >
                            Tiến tới ngay <ArrowRight size={15} />
                          </Link>
                          <p className="ui-stat-label mt-0.5 text-[color:var(--ui-text-soft)]">{ctaHint}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tính năng */}
      <section className="relative mx-auto w-full max-w-7xl px-5 pb-14 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="ui-eyebrow">Tất cả trong một không gian</span>
          <h2 className="mt-3 text-[clamp(24px,3.4vw,34px)] font-bold leading-tight text-white">
            Mọi điều nhỏ xíu, cho hai đứa yêu nhau mỗi ngày
          </h2>
          <p className="ui-body mx-auto mt-3 max-w-lg text-[color:var(--ui-text-muted)]">
            Một nơi duy nhất để lưu giữ, sẻ chia và cùng nhau lớn lên — riêng tư cho đúng hai người.
          </p>
        </motion.div>

        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: (index % 4) * 0.06 }}
                className="ui-card group transition duration-200 hover:-translate-y-0.5"
              >
                <div className="grid h-11 w-11 place-items-center rounded-[12px] bg-[var(--ui-accent-soft)] text-[color:var(--ui-accent)] transition duration-200 group-hover:scale-105">
                  <Icon size={20} />
                </div>
                <h3 className="ui-h3 mt-3 text-white">{item.title}</h3>
                <p className="ui-body mt-1 leading-6 text-[color:var(--ui-text-muted)]">{item.text}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

    </main>
  );
}
