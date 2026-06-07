"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Heart,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/ToastProvider";
import { ApiClientError } from "@/lib/api-client";
import {
  requestPasswordReset,
  resetPassword
} from "@/lib/auth-client";
import { useAuth } from "@/providers/AuthProvider";

export type AuthMode = "login" | "register" | "forgot-password" | "reset-password";

const authCopy = {
  login: {
    title: "Đăng nhập",
    subtitle: "Chào mừng cậu quay lại căn phòng riêng của hai người.",
    action: "Đăng nhập",
    footer: "Chưa có tài khoản?",
    footerHref: "/register",
    footerLabel: "Tạo tài khoản",
    showName: false,
    showOtp: false,
    showPassword: true,
    showConfirmPassword: false
  },
  register: {
    title: "Tạo tài khoản",
    subtitle: "Tạo tài khoản để mở một thế giới nhỏ chỉ hai đứa mình thấy.",
    action: "Đăng ký",
    footer: "Đã có tài khoản?",
    footerHref: "/login",
    footerLabel: "Đăng nhập",
    showName: true,
    showOtp: false,
    showPassword: true,
    showConfirmPassword: true
  },
  "forgot-password": {
    title: "Quên mật khẩu",
    subtitle: "Nhập Gmail hoặc email tài khoản để nhận mã OTP đặt lại mật khẩu.",
    action: "Gửi OTP",
    footer: "Nhớ mật khẩu?",
    footerHref: "/login",
    footerLabel: "Đăng nhập",
    showName: false,
    showOtp: false,
    showPassword: false,
    showConfirmPassword: false
  },
  "reset-password": {
    title: "Đặt lại mật khẩu",
    subtitle: "Nhập OTP và mật khẩu mới để quay lại hồ sơ của bạn.",
    action: "Cập nhật mật khẩu",
    footer: "Cần gửi lại OTP?",
    footerHref: "/forgot-password",
    footerLabel: "Gửi OTP mới",
    showName: false,
    showOtp: true,
    showPassword: true,
    showConfirmPassword: true
  }
} satisfies Record<AuthMode, AuthPageContent>;

type AuthPageContent = {
  title: string;
  subtitle: string;
  action: string;
  footer: string;
  footerHref: string;
  footerLabel: string;
  showName: boolean;
  showOtp: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
};

export function AuthPage({ mode }: { mode: AuthMode }) {
  const copy = authCopy[mode];
  const router = useRouter();
  const { login, register } = useAuth();
  const { notify } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setNotice(null);
    setPending(true);

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    try {
      if (mode === "login") {
        await login(email, password);
        notify({
          tone: "success",
        title: "Đăng nhập thành công",
        message: "Cậu đã vào Cặp đôi đa vũ trụ."
        });
        router.push("/dashboard");
        return;
      }

      if (mode === "register") {
        const displayName = String(formData.get("displayName") ?? "");
        await register(displayName, email, password, confirmPassword);
        notify({
          tone: "success",
          title: "Đăng ký thành công",
          message: "Tài khoản đã được tạo. Hãy tạo hoặc vào phòng riêng để bắt đầu."
        });
        router.push("/dashboard");
        return;
      }

      if (mode === "forgot-password") {
        const result = await requestPasswordReset(email);
        setNotice(
          result.devOtp
            ? `Mã xác nhận: ${result.devOtp}. Hãy dùng mã này để đặt lại mật khẩu.`
            : "Nếu email tồn tại, OTP đặt lại mật khẩu đã được gửi."
        );
        notify({
          tone: "success",
          title: "Đã gửi OTP",
          message: "Hãy kiểm tra email hoặc dùng mã xác nhận đang hiển thị trên màn hình."
        });
        return;
      }

      const otp = String(formData.get("otp") ?? "");
      await resetPassword(email, otp, password, confirmPassword);
      setNotice("Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại.");
      notify({
        tone: "success",
        title: "Đặt lại mật khẩu thành công",
        message: "Bạn có thể đăng nhập bằng mật khẩu mới."
      });
      router.push("/login");
    } catch (caught) {
      const message = caught instanceof ApiClientError ? caught.message : "Không thể xử lý yêu cầu";
      setError(message);
      notify({
        tone: "error",
        title: "Thao tác thất bại",
        message
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="ui-section">
      <div className="mb-5">
        <div className="ui-pill">
          <Heart size={12} fill="currentColor" aria-hidden="true" />
          Tài khoản Cặp đôi đa vũ trụ
        </div>
        <h1 className="ui-h1 mt-4 text-white">
          {copy.title}
        </h1>
        <p className="ui-body mt-2 leading-6 text-[color:var(--ui-text-muted)]">{copy.subtitle}</p>
      </div>

      <form action={handleSubmit} className="grid gap-4">
        {copy.showName ? (
          <TextField
            label="Họ và tên"
            name="displayName"
            placeholder="Nguyễn Hoàng Anh"
            autoComplete="name"
            helper="Tên này sẽ hiển thị trên hồ sơ của bạn."
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
          helper="Dùng email thật để đăng nhập và khôi phục tài khoản."
          leftIcon={<Mail size={18} />}
          required
        />
        {copy.showOtp ? (
          <TextField
            label="Mã OTP"
            name="otp"
            inputMode="numeric"
            placeholder="Nhập 6 chữ số"
            autoComplete="one-time-code"
            leftIcon={<KeyRound size={18} />}
            required
          />
        ) : null}
        {copy.showPassword ? (
          <TextField
            label="Mật khẩu"
            name="password"
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            helper={mode === "register" || mode === "reset-password" ? "Nên dùng mật khẩu khó đoán." : undefined}
            leftIcon={<LockKeyhole size={18} />}
            minLength={6}
            required
          />
        ) : null}
        {copy.showConfirmPassword ? (
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
          type="submit"
          disabled={pending}
          variant="primary"
          icon={<ArrowRight size={16} />}
        >
          {pending ? "Đang xử lý" : copy.action}
        </ActionButton>
      </form>

      {error ? (
        <div className="mt-4 flex items-start gap-3 rounded-[var(--ui-radius-md)] border border-[#ff8ab8]/30 bg-[#ff5ea8]/10 px-3 py-3 text-[13.5px] font-semibold text-[#ffd6e8]">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#ff9ac7]" aria-hidden="true" />
          <p className="leading-5">{error}</p>
        </div>
      ) : null}

      {notice ? (
        <div className="mt-4 flex items-start gap-3 rounded-[var(--ui-radius-md)] border border-[#67e8f9]/24 bg-[#67e8f9]/8 px-3 py-3 text-[13.5px] font-semibold text-[#d7fbff]">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#8ff3ff]" aria-hidden="true" />
          <p className="leading-5">{notice}</p>
        </div>
      ) : null}

      {mode === "login" ? (
        <div className="mt-4 text-right">
          <Link href="/forgot-password" className="text-[13px] font-semibold text-[color:var(--ui-accent)] hover:text-white">
            Quên mật khẩu
          </Link>
        </div>
      ) : null}

      <p className="ui-card ui-body mt-5 text-center text-[color:var(--ui-text-muted)]">
        {copy.footer}{" "}
        <Link href={copy.footerHref} className="font-semibold text-[color:var(--ui-accent)] hover:text-white">
          {copy.footerLabel}
        </Link>
      </p>
    </section>
  );
}
