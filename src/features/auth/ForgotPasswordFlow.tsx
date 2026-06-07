"use client";

import { useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, Heart, KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/ToastProvider";
import { ApiClientError } from "@/lib/api-client";
import { requestPasswordReset, resetPassword, verifyResetOtp } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

type Step = "email" | "otp" | "password" | "done";

const STEP_INDEX: Record<Step, number> = { email: 0, otp: 1, password: 2, done: 3 };

function errMessage(error: unknown) {
  return error instanceof ApiClientError ? error.message : "Không thể xử lý yêu cầu";
}

export function ForgotPasswordFlow() {
  const { notify } = useToast();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const boxRefs = useRef<Array<HTMLInputElement | null>>([]);

  const otp = digits.join("");

  async function sendCode(formData: FormData) {
    const value = String(formData.get("email") ?? "").trim();
    if (!value) {
      return;
    }
    setEmail(value);
    setError(null);
    setPending(true);
    try {
      const res = await requestPasswordReset(value);
      if (res.devOtp) {
        const six = res.devOtp.padEnd(6, " ").slice(0, 6).split("");
        setDigits(six.map((char) => (char === " " ? "" : char)));
        setHint(`Chế độ thử nghiệm — mã của bạn là ${res.devOtp}`);
      } else {
        setHint("Đã gửi mã 6 số về email của bạn — kiểm tra hộp thư (kể cả mục Spam) nhé 💌");
      }
      setStep("otp");
      notify({ tone: "success", title: "Đã gửi mã xác nhận" });
    } catch (caught) {
      setError(errMessage(caught));
    } finally {
      setPending(false);
    }
  }

  async function confirmCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (otp.length !== 6) {
      setError("Vui lòng nhập đủ 6 chữ số.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      await verifyResetOtp(email, otp);
      setHint(null);
      setStep("password");
    } catch (caught) {
      setError(errMessage(caught));
    } finally {
      setPending(false);
    }
  }

  async function changePassword(formData: FormData) {
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    if (password.length < 6 || password !== confirmPassword) {
      setError("Mật khẩu cần ít nhất 6 ký tự và khớp xác nhận.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      await resetPassword(email, otp, password, confirmPassword);
      setStep("done");
      notify({ tone: "success", title: "Đổi mật khẩu thành công", message: "Đăng nhập lại bằng mật khẩu mới nhé." });
    } catch (caught) {
      setError(errMessage(caught));
    } finally {
      setPending(false);
    }
  }

  function handleDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) {
      boxRefs.current[index + 1]?.focus();
    }
  }

  function handleKey(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      boxRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) {
      return;
    }
    event.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < text.length; i += 1) {
      next[i] = text[i];
    }
    setDigits(next);
    boxRefs.current[Math.min(text.length, 5)]?.focus();
  }

  const stepNo = STEP_INDEX[step];

  return (
    <section className="ui-section">
      <div className="mb-5">
        <div className="ui-pill">
          <Heart size={12} fill="currentColor" aria-hidden="true" /> Khôi phục tài khoản
        </div>
        <h1 className="ui-h1 mt-4 text-white">
          {step === "email"
            ? "Quên mật khẩu"
            : step === "otp"
              ? "Nhập mã xác nhận"
              : step === "password"
                ? "Đặt mật khẩu mới"
                : "Xong rồi 🎉"}
        </h1>
        <p className="ui-body mt-2 leading-6 text-[color:var(--ui-text-muted)]">
          {step === "email"
            ? "Nhập email tài khoản để nhận mã 6 số đặt lại mật khẩu."
            : step === "otp"
              ? `Đã gửi mã tới ${email}. Nhập 6 chữ số để xác nhận.`
              : step === "password"
                ? "Tạo mật khẩu mới cho tài khoản của bạn."
                : "Mật khẩu đã được đổi. Hãy đăng nhập lại nhé."}
        </p>
      </div>

      {step !== "done" ? (
        <div className="mb-5 flex items-center gap-2">
          {["Email", "Mã", "Mật khẩu"].map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black",
                  i <= stepNo ? "bg-[color:var(--ui-accent)] text-[#1a0a16]" : "bg-white/8 text-[color:var(--ui-text-soft)]"
                )}
              >
                {i + 1}
              </span>
              <span className={cn("text-[12px] font-semibold", i <= stepNo ? "text-white" : "text-[color:var(--ui-text-soft)]")}>{label}</span>
              {i < 2 ? <span className="h-px flex-1 bg-white/10" /> : null}
            </div>
          ))}
        </div>
      ) : null}

      {step === "email" ? (
        <form action={sendCode} className="grid gap-4">
          <TextField
            label="Email tài khoản"
            name="email"
            type="email"
            placeholder="tenban@gmail.com"
            autoComplete="email"
            leftIcon={<Mail size={18} />}
            required
          />
          <ActionButton className="mt-1 min-h-11 w-full text-[14px]" type="submit" disabled={pending} variant="primary" icon={<ArrowRight size={16} />}>
            {pending ? "Đang gửi" : "Gửi mã xác nhận"}
          </ActionButton>
        </form>
      ) : null}

      {step === "otp" ? (
        <form onSubmit={confirmCode} className="grid gap-4">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  boxRefs.current[i] = el;
                }}
                value={digit}
                inputMode="numeric"
                maxLength={1}
                aria-label={`Chữ số thứ ${i + 1}`}
                onChange={(event) => handleDigit(i, event.target.value)}
                onKeyDown={(event) => handleKey(i, event)}
                className="h-14 w-12 rounded-[10px] border border-[rgba(240,164,196,0.18)] bg-[rgba(12,11,32,0.5)] text-center text-2xl font-black text-white outline-none transition focus:border-[color:var(--ui-accent)] focus:ring-2 focus:ring-[rgba(240,164,196,0.3)]"
              />
            ))}
          </div>
          <ActionButton className="mt-1 min-h-11 w-full text-[14px]" type="submit" disabled={pending || otp.length !== 6} variant="primary" icon={<ArrowRight size={16} />}>
            {pending ? "Đang kiểm tra" : "Xác nhận mã"}
          </ActionButton>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setError(null);
              setHint(null);
            }}
            className="text-center text-[12.5px] font-semibold text-[color:var(--ui-text-muted)] transition hover:text-white"
          >
            ← Đổi email hoặc gửi lại mã
          </button>
        </form>
      ) : null}

      {step === "password" ? (
        <form action={changePassword} className="grid gap-4">
          <TextField
            label="Mật khẩu mới"
            name="password"
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            autoComplete="new-password"
            leftIcon={<LockKeyhole size={18} />}
            minLength={6}
            required
          />
          <TextField
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            autoComplete="new-password"
            leftIcon={<ShieldCheck size={18} />}
            minLength={6}
            required
          />
          <ActionButton className="mt-1 min-h-11 w-full text-[14px]" type="submit" disabled={pending} variant="primary" icon={<ArrowRight size={16} />}>
            {pending ? "Đang đổi" : "Đổi mật khẩu"}
          </ActionButton>
        </form>
      ) : null}

      {step === "done" ? (
        <div className="grid gap-4 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[var(--ui-accent-soft)] text-[color:var(--ui-accent)]">
            <CheckCircle2 size={32} />
          </span>
          <Link href="/login" className="only-button-primary mx-auto">
            <KeyRound size={16} /> Đăng nhập ngay
          </Link>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 flex items-start gap-3 rounded-[var(--ui-radius-md)] border border-[#ff8ab8]/30 bg-[#ff5ea8]/10 px-3 py-3 text-[13.5px] font-semibold text-[#ffd6e8]">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#ff9ac7]" aria-hidden="true" />
          <p className="leading-5">{error}</p>
        </div>
      ) : null}

      {hint && step === "otp" ? (
        <div className="mt-4 flex items-start gap-3 rounded-[var(--ui-radius-md)] border border-[#67e8f9]/24 bg-[#67e8f9]/8 px-3 py-3 text-[13.5px] font-semibold text-[#d7fbff]">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#8ff3ff]" aria-hidden="true" />
          <p className="leading-5">{hint}</p>
        </div>
      ) : null}

      <p className="ui-card ui-body mt-5 text-center text-[color:var(--ui-text-muted)]">
        Nhớ mật khẩu rồi?{" "}
        <Link href="/login" className="font-semibold text-[color:var(--ui-accent)] hover:text-white">
          Đăng nhập
        </Link>
      </p>
    </section>
  );
}
