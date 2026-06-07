"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Heart, LockKeyhole, Mail, ShieldCheck, UserRound, X } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { CosmicLoveArt } from "@/components/auth/CosmicLoveArt";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/ToastProvider";
import { ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/providers/AuthProvider";

type Mode = "login" | "register";

export function AuthModal() {
  const { authModalOpen, closeAuth, login, register } = useAuth();
  const { notify } = useToast();
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!authModalOpen) {
    return null;
  }

  const title = mode === "login" ? "Đăng nhập để tiếp tục" : "Tạo tài khoản mới";
  const subtitle =
    mode === "login"
      ? "Vào tài khoản để mở căn phòng riêng, kỷ niệm và lời nhắn của hai người."
      : "Tạo tài khoản để mở một thế giới nhỏ chỉ hai người thấy.";

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);

    try {
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");

      if (mode === "login") {
        await login(email, password);
        notify({ tone: "success", title: "Đăng nhập thành công", message: "Cậu có thể tiếp tục thao tác vừa chọn." });
      } else {
        const displayName = String(formData.get("displayName") ?? "");
        const confirmPassword = String(formData.get("confirmPassword") ?? "");
        await register(displayName, email, password, confirmPassword);
        notify({ tone: "success", title: "Đăng ký thành công", message: "Tài khoản đã sẵn sàng. Hãy tạo hoặc vào phòng riêng." });
      }
    } catch (caught) {
      const message = caught instanceof ApiClientError ? caught.message : "Không thể hoàn tất thao tác";
      setError(message);
      notify({ tone: "error", title: "Không thể hoàn tất", message });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="only-modal-backdrop fixed inset-0 z-50 flex overflow-y-auto px-4 py-6">
      <div className="only-modal-card only-pop relative m-auto w-full max-w-[880px] overflow-hidden p-0">
        <button
          type="button"
          aria-label="Đóng"
          onClick={closeAuth}
          className="absolute right-3.5 top-3.5 z-20 inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/12 bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40"
        >
          <X size={17} aria-hidden="true" />
        </button>

        <div className="grid lg:grid-cols-2">
          {/* Tranh tình yêu vũ trụ — banner trên cùng ở màn nhỏ, cột trái ở màn rộng */}
          <aside className="relative h-40 overflow-hidden sm:h-44 lg:h-auto lg:min-h-[560px]">
            <CosmicLoveArt />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0a22]/85 via-transparent to-[#0b0a22]/15" />
            <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6 lg:p-7">
              <span className="ui-pill w-fit text-white">
                <Heart size={12} fill="currentColor" /> Cosmic Love
              </span>
              <div className="hidden lg:block">
                <h2 className="text-[26px] font-extrabold leading-snug text-white">
                  Một vũ trụ nhỏ,
                  <br />
                  chỉ của riêng hai người 💞
                </h2>
                <p className="ui-body mt-2 max-w-[300px] text-white/75">
                  Nơi giữ kỷ niệm, lời nhắn, bài hát và những điều muốn làm cùng nhau.
                </p>
              </div>
            </div>
          </aside>

          {/* Form */}
          <section className="relative p-6 sm:p-7">
            <h1 className="text-[22px] font-extrabold leading-tight text-white">{title}</h1>
            <p className="ui-body mt-1.5 text-[color:var(--ui-text-muted)]">{subtitle}</p>

            <div className="mt-5 grid grid-cols-2 gap-1 rounded-[12px] border border-white/10 bg-white/[0.05] p-1">
              {(["login", "register"] as Mode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setMode(item);
                    setError(null);
                  }}
                  className={`min-h-10 rounded-[9px] text-sm font-semibold transition ${
                    mode === item
                      ? "bg-white/14 text-white"
                      : "text-[color:var(--ui-text-muted)] hover:bg-white/8 hover:text-white"
                  }`}
                >
                  {item === "login" ? "Đăng nhập" : "Đăng ký"}
                </button>
              ))}
            </div>

            <form action={handleSubmit} className="mt-5 grid gap-4">
              {mode === "register" ? (
                <TextField
                  label="Họ và tên"
                  name="displayName"
                  placeholder="Nguyễn Hoàng Anh"
                  autoComplete="name"
                  leftIcon={<UserRound size={18} />}
                  required
                />
              ) : null}

              <TextField
                label="Gmail của bạn"
                name="email"
                type="email"
                placeholder="tenban@gmail.com"
                autoComplete="email"
                leftIcon={<Mail size={18} />}
                required
              />
              <TextField
                label="Mật khẩu"
                name="password"
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                leftIcon={<LockKeyhole size={18} />}
                minLength={6}
                required
              />

              {mode === "register" ? (
                <TextField
                  label="Xác nhận mật khẩu"
                  name="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  leftIcon={<ShieldCheck size={18} />}
                  minLength={6}
                  required
                />
              ) : null}

              <ActionButton
                className="mt-1 min-h-11 w-full text-[14px]"
                disabled={pending}
                icon={<ArrowRight size={16} />}
                type="submit"
                variant="primary"
              >
                {pending ? "Đang xử lý" : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
              </ActionButton>
            </form>

            {mode === "login" ? (
              <div className="mt-3 text-right">
                <Link
                  href="/forgot-password"
                  onClick={closeAuth}
                  className="text-[13px] font-semibold text-[color:var(--ui-accent)] hover:text-white"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            ) : null}

            {error ? (
              <p className="mt-4 rounded-[var(--ui-radius-md)] border border-[#ff8ab8]/30 bg-[#ff5ea8]/10 px-3 py-2 text-sm font-semibold text-[#ffd6e8]">
                {error}
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
