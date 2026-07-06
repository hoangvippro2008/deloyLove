"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Save } from "lucide-react";
import { AvatarCropper } from "@/components/ui/AvatarCropper";
import { BirthdayPicker } from "@/components/ui/BirthdayPicker";
import { useToast } from "@/components/ui/ToastProvider";
import { authRequest } from "@/lib/auth-client";
import { resolveAvatar } from "@/lib/avatars";
import { useAuth } from "@/providers/AuthProvider";

type Profile = {
  id: string;
  email: string;
  displayName: string;
  nickname: string | null;
  avatarUrl: string | null;
  birthday: string | null;
  gender: string | null;
  bio: string | null;
  interests: string[];
  defaultMood: string | null;
  couple: { roomName: string; status: string } | null;
};

type FormState = Record<string, string>;

export function ProfilePage() {
  const { notify } = useToast();
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<FormState>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const avatarPreview = useMemo(
    () => avatarFile ? URL.createObjectURL(avatarFile) : resolveAvatar({ avatarUrl: profile?.avatarUrl, id: profile?.id, name: profile?.displayName, gender: form.gender ?? profile?.gender }),
    [avatarFile, profile?.avatarUrl, profile?.id, profile?.displayName, profile?.gender, form.gender]
  );

  useEffect(() => {
    if (!avatarFile || !avatarPreview?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(avatarPreview);
  }, [avatarFile, avatarPreview]);

  useEffect(() => {
    authRequest<{ profile: Profile }>("/profile/me")
      .then(({ profile: data }) => {
        setProfile(data);
        setForm({
          displayName: data.displayName ?? "",
          nickname: data.nickname ?? "",
          birthday: data.birthday ?? "",
          gender: data.gender ?? "",
          bio: data.bio ?? "",
          interests: data.interests.join(", "),
          defaultMood: data.defaultMood ?? ""
        });
      })
      .catch((error) => notify({ tone: "error", title: "Không tải được hồ sơ", message: error instanceof Error ? error.message : "Thử lại sau." }))
      .finally(() => setLoading(false));
  }, [notify]);

  function onPickAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.currentTarget.value = "";

    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      notify({ tone: "error", title: "Ảnh không hợp lệ", message: "Chọn JPG, PNG hoặc WEBP dưới 2MB." });
      return;
    }

    // Mở khung crop trước khi nhận ảnh, tránh avatar bị lệch
    setPendingCropFile(file);``
  }

  async function saveAvatar() {
    if (!avatarFile) return;
    setSaving(true);
    try {
      const data = new FormData();
      data.append("avatar", avatarFile);
      const result = await authRequest<{ profile: Profile }>("/profile/avatar", { method: "POST", body: data });
      setProfile(result.profile);
      setAvatarFile(null);
      void refreshUser().catch(() => undefined);
      notify({ tone: "success", title: "Đã cập nhật avatar" });
    } catch (error) {
      notify({ tone: "error", title: "Chưa lưu được avatar", message: error instanceof Error ? error.message : "Thử ảnh khác." });
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await authRequest<{ profile: Profile }>("/profile/me", {
        method: "PUT",
        body: JSON.stringify(form)
      });
      setProfile(result.profile);
      void refreshUser().catch(() => undefined);
      notify({ tone: "success", title: "Đã lưu hồ sơ" });
      router.push("/dashboard");
    } catch (error) {
      notify({ tone: "error", title: "Chưa lưu được hồ sơ", message: error instanceof Error ? error.message : "Kiểm tra lại thông tin." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="ui-section ui-body mx-auto flex max-w-5xl items-center gap-3 text-[color:var(--ui-text-muted)]"><Loader2 className="animate-spin" /> Đang tải hồ sơ...</div>;
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-5 text-white">
      <header className="ui-section">
        <p className="ui-eyebrow">Profile</p>
        <h1 className="ui-h1 mt-2 text-white">Hồ sơ cá nhân</h1>
        <p className="ui-body mt-2 max-w-2xl leading-6 text-[color:var(--ui-text-muted)]">Cập nhật ảnh, biệt danh và vài thông tin cơ bản để bảo mật thông tin cá nhân.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="ui-section">
          <div className="relative mx-auto h-28 w-28">
            <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-[var(--ui-radius-lg)] border border-white/14 bg-white/8 text-xl font-bold">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
            </div>
            <label className="absolute bottom-1 right-1 grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-white/14 bg-[var(--ui-bg-deep)] text-white transition hover:bg-white/12">
              <Camera size={16} />
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPickAvatar} />
            </label>
          </div>
          <div className="mt-5 text-center">
            <h2 className="ui-h2 text-white">{profile?.displayName}</h2>
            <p className="ui-caption mt-1 text-[color:var(--ui-text-muted)]">{profile?.email}</p>
            <p className="ui-pill mt-3 justify-center">
              {profile?.couple ? `Đã ghép đôi: ${profile.couple.roomName}` : "Chưa ghép đôi"}
            </p>
          </div>
          <button type="button" disabled={!avatarFile || saving} onClick={saveAvatar} className="only-button-primary mt-5 w-full">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Lưu ảnh
          </button>

          {pendingCropFile ? (
            <AvatarCropper
              file={pendingCropFile}
              onCancel={() => setPendingCropFile(null)}
              onConfirm={(cropped) => {
                setAvatarFile(cropped);
                setPendingCropFile(null);
              }}
            />
          ) : null}
        </aside>

        <form className="ui-section grid gap-4" onSubmit={saveProfile}>
          <div>
            <h2 className="ui-h2 text-white">Thông tin hiển thị</h2>
            <p className="ui-body mt-1 text-[color:var(--ui-text-muted)]">Ngắn gọn, dễ nhận ra, không cần điền hết.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-[color:var(--ui-text-muted)]">Tên hiển thị<input className="only-field" value={form.displayName ?? ""} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} /></label>
            <label className="grid gap-2 text-sm font-semibold text-[color:var(--ui-text-muted)]">Biệt danh<input className="only-field" value={form.nickname ?? ""} onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))} /></label>
            <div className="grid gap-2 text-sm font-semibold text-[color:var(--ui-text-muted)]">
              <span>Ngày sinh</span>
              <BirthdayPicker value={form.birthday ?? ""} onChange={(v) => setForm((f) => ({ ...f, birthday: v }))} />
            </div>
            <label className="grid gap-2 text-sm font-semibold text-[color:var(--ui-text-muted)]">Giới tính
              <select className="only-field" value={form.gender ?? ""} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
                <option value="">Chưa chọn</option>
                <option value="female">Nữ</option>
                <option value="male">Nam</option>
              </select>
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-[color:var(--ui-text-muted)]">Bio<textarea className="only-field min-h-28 py-3" value={form.bio ?? ""} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Một mô tả ngắn về bạn" /></label>
          <label className="grid gap-2 text-sm font-semibold text-[color:var(--ui-text-muted)]">Sở thích<input className="only-field" value={form.interests ?? ""} onChange={(e) => setForm((f) => ({ ...f, interests: e.target.value }))} placeholder="phim, nhạc, du lịch..." /></label>
          <label className="grid gap-2 text-sm font-semibold text-[color:var(--ui-text-muted)]">Mood mặc định<input className="only-field" value={form.defaultMood ?? ""} onChange={(e) => setForm((f) => ({ ...f, defaultMood: e.target.value }))} placeholder="bình yên, vui, nhớ..." /></label>
          <button className="only-button-primary w-fit px-6" disabled={saving}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Lưu hồ sơ</button>
        </form>
      </div>
    </section>
  );
}
