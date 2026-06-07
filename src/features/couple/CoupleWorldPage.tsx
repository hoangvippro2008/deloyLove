"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Album,
  ArrowLeft,
  ArrowRight,
  Cake,
  CalendarDays,
  CalendarHeart,
  CheckCircle2,
  Copy,
  Flame,
  FolderOpen,
  Heart,
  Home,
  ImagePlus,
  KeyRound,
  LetterText,
  Loader2,
  Music2,
  PartyPopper,
  Plane,
  Play,
  Plus,
  Settings,
  Sparkles,
  Star,
  Tent,
  Ticket,
  Trash2,
  Trophy,
  Utensils,
  Wallet,
  X,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/ToastProvider";
import { CoupleCalendarBoard } from "@/features/couple/CoupleCalendarBoard";
import { LetterPaper } from "@/features/couple/LetterPaper";
import { LetterReader } from "@/features/couple/LetterReader";
import type { CoupleLetter } from "@/features/couple/letter-types";
import { createMediaUrl } from "@/lib/api-client";
import { authRequest } from "@/lib/auth-client";
import { resolveAvatar, pickCouplePhoto } from "@/lib/avatars";
import { cn } from "@/lib/cn";
import { useAuth } from "@/providers/AuthProvider";

export type CoupleMode =
  | "home"
  | "memories"
  | "calendar"
  | "music"
  | "tasks"
  | "letters"
  | "questions"
  | "album"
  | "bucket"
  | "wallet"
  | "stats"
  | "challenges"
  | "settings";

type Member = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: "owner" | "partner";
  nickname: string | null;
  joinedAt: string;
  lastSeenAt: string | null;
  isOnline: boolean;
};

type Room = {
  id: string;
  roomName: string;
  inviteCode: string;
  ownerUserId: string;
  anniversaryDate: string | null;
  coupleAvatarUrl: string | null;
  roomBio: string | null;
  theme: string;
  status: "waiting" | "paired";
  role: "owner" | "partner";
  nickname: string | null;
  memberCount: number;
  members: Member[];
};

type Memory = {
  id: string;
  title: string;
  content: string | null;
  memoryDate: string | null;
  imageUrl: string | null;
  placeName: string | null;
  creator: { name: string; avatarUrl: string | null } | null;
};

type Song = {
  id: string;
  title: string;
  artist: string | null;
  sourceType: "soundcloud" | "youtube" | "spotify" | "custom";
  sourceUrl: string;
  message: string | null;
  addedByName: string | null;
};

type CoupleTask = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: "todo" | "doing" | "done";
  completedAt: string | null;
  creatorName: string | null;
};

type BucketItem = {
  id: string;
  title: string;
  note: string | null;
  isDone: boolean;
  doneAt: string | null;
  createdAt: string | null;
  creatorName: string | null;
};

type WalletEntry = {
  id: string;
  category: string;
  title: string;
  amount: number;
  note: string | null;
  spentAt: string | null;
  createdBy: string;
  creatorName: string | null;
  createdAt: string | null;
};

type CoupleStats = {
  letters: number;
  memories: number;
  photos: number;
  events: number;
  dates: number;
  songs: number;
  bucketDone: number;
  moods: number;
};

type Challenge = {
  id: string;
  title: string;
  targetDays: number;
  doneDays: number;
  todayChecked: boolean;
  streak: number;
};

type CalendarEventType = "date" | "camping" | "picnic" | "movie" | "dinner" | "travel" | "birthday" | "anniversary" | "other";

type CalendarEvent = {
  id: string;
  createdBy: string;
  title: string;
  eventType: CalendarEventType;
  description: string | null;
  startsAt: string | null;
  reminderSentAt: string | null;
  creatorName: string | null;
};

type Letter = CoupleLetter;

type QuestionBundle = {
  question: { id: string; question: string; category: string | null } | null;
  answers: Array<{
    id: string;
    userId: string;
    answer: string;
    user: { name: string; avatarUrl: string | null };
  }>;
  roomQuizzes: RoomQuiz[];
};

type RoomQuizAnswer = {
  id: string;
  quizId: string;
  userId: string;
  answer: string;
  user: { name: string; avatarUrl: string | null };
};

type RoomQuiz = {
  id: string;
  question: string;
  quizType: "open" | "choice";
  options: string[];
  creator: { name: string; avatarUrl: string | null };
  answers: RoomQuizAnswer[];
  createdAt: string | null;
};

type QuizOptionKey = "A" | "B" | "C" | "D";

type QuizGameQuestion = {
  id: string;
  questionText: string;
  options: Array<{ key: QuizOptionKey; text: string }>;
  correctOption?: QuizOptionKey;
  sortOrder: number;
};

type QuizAttempt = {
  id: string;
  gameId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  durationSeconds: number;
  completedAt: string | null;
  user: { name: string; avatarUrl: string | null };
};

type QuizGame = {
  id: string;
  title: string;
  meaning: string | null;
  timeLimitSeconds: number;
  createdBy: string;
  creator: { name: string; avatarUrl: string | null };
  questions: QuizGameQuestion[];
  attempts: QuizAttempt[];
  createdAt: string | null;
};

type Mood = {
  id: string;
  mood: string;
  note: string | null;
  user: { name: string; avatarUrl: string | null };
};

type AlbumPhoto = {
  id: string;
  albumId: string;
  uploadedBy: string;
  imageUrl: string;
  caption: string | null;
  uploaderName: string | null;
  createdAt: string | null;
};

type CoupleAlbum = {
  id: string;
  title: string;
  description: string | null;
  photos: AlbumPhoto[];
};

type Summary = {
  room: Room;
  todayMoods: Mood[];
  recentMemories: Memory[];
  currentSong: Song | null;
  pendingTasks: CoupleTask[];
  dailyQuestion: QuestionBundle["question"];
};

type FormState = Record<string, string>;

const modeMeta: Record<CoupleMode, { label: string; icon: typeof Home; hint: string }> = {
  home: { label: "Phòng nhỏ", icon: Home, hint: "Tổng quan của hai đứa mình" },
  memories: { label: "Kỷ niệm", icon: CalendarHeart, hint: "Những ngày muốn giữ lại" },
  calendar: { label: "Lịch hẹn", icon: CalendarDays, hint: "Ngày giờ, kế hoạch, nhắc hẹn" },
  music: { label: "Bài hát", icon: Music2, hint: "Gửi nhau một giai điệu" },
  tasks: { label: "Việc đôi", icon: CheckCircle2, hint: "Điều muốn làm cùng nhau" },
  letters: { label: "Lời nhắn", icon: LetterText, hint: "Một góc viết cho người ấy" },
  questions: { label: "Tâm sự", icon: Sparkles, hint: "Một câu mỗi ngày để hiểu nhau hơn" },
  album: { label: "Ảnh", icon: Album, hint: "Ảnh riêng của tụi mình" },
  bucket: { label: "Mong ước", icon: Star, hint: "Những điều hai đứa muốn làm cùng nhau" },
  wallet: { label: "Ví chung", icon: Wallet, hint: "Ghi chép chi tiêu chung của hai đứa" },
  stats: { label: "Thành tựu", icon: Trophy, hint: "Những con số đáng nhớ của hai đứa" },
  challenges: { label: "Thử thách", icon: Flame, hint: "Thử thách mỗi ngày, giữ chuỗi streak cùng nhau" },
  settings: { label: "Cài đặt", icon: Settings, hint: "Tên phòng, mã mời và ngày bắt đầu" }
};

const fieldClass = "only-field";
const panelClass = "ui-section text-white";
const cardClass = "ui-card";
const softButton = "only-button-secondary";
const primaryButton = "only-button-primary";

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Chưa đặt ngày";
  }

  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value));
}

function daysTogether(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const start = new Date(value).getTime();
  const diff = Date.now() - start;

  if (!Number.isFinite(diff)) {
    return null;
  }

  return Math.max(1, Math.floor(diff / 86_400_000) + 1);
}

const calendarEventMeta: Record<CalendarEventType, { icon: LucideIcon; label: string; color: string }> = {
  date: { icon: Heart, label: "Hẹn hò", color: "#ff5ea8" },
  camping: { icon: Tent, label: "Cắm trại", color: "#a3e635" },
  picnic: { icon: CalendarHeart, label: "Picnic", color: "#86efac" },
  movie: { icon: Ticket, label: "Xem phim", color: "#fb923c" },
  dinner: { icon: Utensils, label: "Ăn tối", color: "#f87171" },
  travel: { icon: Plane, label: "Du lịch", color: "#67e8f9" },
  birthday: { icon: Cake, label: "Sinh nhật", color: "#facc15" },
  anniversary: { icon: PartyPopper, label: "Kỷ niệm", color: "#c084fc" },
  other: { icon: Star, label: "Khác", color: "#a78bfa" }
};

function startOfDay(ts: number) {
  const date = new Date(ts);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function relativeDayLabel(date: Date, now: number) {
  const diff = Math.round((startOfDay(date.getTime()) - startOfDay(now)) / 86_400_000);
  if (diff === 0) return "Hôm nay";
  if (diff === 1) return "Ngày mai";
  if (diff === -1) return "Hôm qua";
  if (diff > 1) return `Còn ${diff} ngày`;
  return `${Math.abs(diff)} ngày trước`;
}

function formatEventTime(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function toInputDateTime(value: Date) {
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

function createYouTubeVideoId(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

function createYouTubeEmbed(url: string, autoplay = false) {
  const id = createYouTubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}?rel=0&playsinline=1${autoplay ? "&autoplay=1" : ""}` : null;
}

function formatOnline(member: Member) {
  if (member.isOnline) {
    return "Đang online";
  }

  if (!member.lastSeenAt) {
    return "Chưa có hoạt động";
  }

  return `Hoạt động ${new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit"
  }).format(new Date(member.lastSeenAt))}`;
}

function getMemberLabel(member: Pick<Member, "name" | "email" | "nickname">) {
  return member.nickname ?? member.name ?? member.email ?? "Người ấy";
}

async function readImageAsDataUrl(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Vui lòng chọn đúng file ảnh");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Ảnh tối đa 5MB");
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Không đọc được ảnh"));
    reader.readAsDataURL(file);
  });
}

function ImagePicker({
  onPick,
  onClear,
  preview,
  title = "Tải ảnh lên"
}: {
  onPick: (imageData: string) => void;
  onClear: () => void;
  preview?: string | null;
  title?: string;
}) {
  const { notify } = useToast();

  return (
    <div className="ui-card border-dashed">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Ảnh đã chọn" className="h-24 w-24 rounded-[var(--ui-radius-md)] object-cover" />
        ) : (
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-[var(--ui-radius-md)] border border-white/10 bg-white/6 text-[color:var(--ui-accent)]">
            <ImagePlus size={28} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="ui-h3 text-white">{title}</p>
          <p className="ui-caption mt-1 leading-5 text-[color:var(--ui-text-soft)]">JPG, PNG, WEBP hoặc GIF. Ảnh được lưu vào phòng riêng của hai người.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className={cn(softButton, "cursor-pointer")}>
              <ImagePlus size={16} />
              Chọn ảnh
              <input
                className="hidden"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.currentTarget.value = "";

                  if (!file) {
                    return;
                  }

                  readImageAsDataUrl(file)
                    .then(onPick)
                    .catch((error) =>
                      notify({
                        tone: "error",
                        title: "Không dùng được ảnh",
                        message: error instanceof Error ? error.message : "Thử ảnh khác nhé."
                      })
                    );
                }}
              />
            </label>
            {preview ? (
              <button type="button" className={softButton} onClick={onClear}>
                Bỏ ảnh
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function SongEmbed({ song }: { song: Song }) {
  if (song.sourceType === "soundcloud") {
    return (
      <iframe
        title={song.title}
        className="mt-3 h-28 w-full rounded-2xl border-0"
        allow="autoplay"
        src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(song.sourceUrl)}&color=%23d77d9e&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false`}
      />
    );
  }

  const youtubeEmbed = song.sourceType === "youtube" ? createYouTubeEmbed(song.sourceUrl) : null;

  if (youtubeEmbed) {
    return <iframe title={song.title} className="mt-3 aspect-video w-full rounded-2xl border-0" src={youtubeEmbed} />;
  }

  return (
    <a className="mt-3 block truncate rounded-[var(--ui-radius-sm)] border border-white/10 bg-white/[0.04] px-4 py-3 text-[13.5px] font-semibold text-[color:var(--ui-accent)]" href={song.sourceUrl} target="_blank">
      Mở bài hát
    </a>
  );
}

function AvatarPair({ room }: { room: Room }) {
  return (
    <div className="flex items-center">
      {room.members.map((member, index) => {
        const memberLabel = getMemberLabel(member);
        const avatar = resolveAvatar({ avatarUrl: member.avatarUrl, id: member.id, name: memberLabel });

        return (
          <div
            key={member.id}
            className={cn(
              "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#0e1024] bg-white/8 text-sm font-bold text-white",
              index > 0 && "-ml-2.5"
            )}
            title={memberLabel}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatar} alt={memberLabel} className="h-full w-full object-cover" />
          </div>
        );
      })}
    </div>
  );
}

function RoomGate({ onChanged }: { onChanged: () => Promise<void> }) {
  const { notify } = useToast();
  const [createForm, setCreateForm] = useState<FormState>({ roomName: "", anniversaryDate: "", nickname: "" });
  const [joinForm, setJoinForm] = useState<FormState>({ inviteCode: "", nickname: "" });
  const [busy, setBusy] = useState(false);

  async function submit(path: string, body: Record<string, string>) {
    setBusy(true);
    try {
      await authRequest(path, { method: "POST", body: JSON.stringify(body) });
      await onChanged();
      notify({ tone: "success", title: "Đã mở cửa phòng", message: "Từ giờ nơi này chỉ dành cho hai người." });
    } catch (error) {
      notify({ tone: "error", title: "Chưa vào được phòng", message: error instanceof Error ? error.message : "Thử lại sau nhé." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1fr_0.95fr]">
      <div className={panelClass}>
        <p className="ui-eyebrow">Bạn chưa có phòng riêng</p>
        <h1 className="ui-h1 mt-3 text-white">Tạo mã ghép đôi</h1>
        <p className="ui-body mt-3 max-w-xl leading-6 text-[color:var(--ui-text-muted)]">
          Sau khi tạo phòng, hệ thống sinh mã mời. Người còn lại dùng mã đó để vào. Mỗi phòng chỉ có tối đa hai thành viên.
        </p>
        <form
          className="mt-6 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submit("/room", createForm);
          }}
        >
          <input className={fieldClass} placeholder="Tên phòng, ví dụ: Nhà nhỏ của tụi mình" value={createForm.roomName} onChange={(event) => setCreateForm((form) => ({ ...form, roomName: event.target.value }))} />
          <input className={fieldClass} type="date" value={createForm.anniversaryDate} onChange={(event) => setCreateForm((form) => ({ ...form, anniversaryDate: event.target.value }))} />
          <input className={fieldClass} placeholder="Nickname của cậu trong phòng" value={createForm.nickname} onChange={(event) => setCreateForm((form) => ({ ...form, nickname: event.target.value }))} />
          <button className={primaryButton} disabled={busy} type="submit">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Tạo mã ghép đôi
          </button>
        </form>
      </div>

      <div className={panelClass}>
        <p className="ui-eyebrow">Đã có mã mời</p>
        <h2 className="ui-h2 mt-3 text-white">Nhập mã người ấy</h2>
        <p className="ui-body mt-3 leading-6 text-[color:var(--ui-text-muted)]">Nhập mã mời người ấy gửi. Nếu phòng đã đủ hai người, hệ thống sẽ chặn tham gia.</p>
        <form
          className="mt-6 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submit("/room/join", joinForm);
          }}
        >
          <input className={fieldClass} placeholder="Mã mời" value={joinForm.inviteCode} onChange={(event) => setJoinForm((form) => ({ ...form, inviteCode: event.target.value.toUpperCase() }))} />
          <input className={fieldClass} placeholder="Nickname của cậu" value={joinForm.nickname} onChange={(event) => setJoinForm((form) => ({ ...form, nickname: event.target.value }))} />
          <button className={softButton} disabled={busy} type="submit">
            <KeyRound size={16} />
            Vào phòng
          </button>
        </form>
      </div>
    </section>
  );
}

function InlineForm({
  children,
  onSubmit,
  title
}: {
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  title: string;
}) {
  return (
    <form className="ui-card grid gap-3" onSubmit={onSubmit}>
      <p className="ui-h3 text-white">{title}</p>
      {children}
    </form>
  );
}

function EmptyState({
  action,
  icon: Icon = Sparkles,
  text,
  title
}: {
  action?: ReactNode;
  icon?: LucideIcon;
  text: string;
  title: string;
}) {
  return (
    <div className="ui-card grid place-items-center text-center">
      <div className="grid h-11 w-11 place-items-center rounded-[var(--ui-radius-sm)] bg-[var(--ui-accent-soft)] text-[color:var(--ui-accent)]">
        <Icon size={20} />
      </div>
      <p className="ui-h3 mt-3 text-white">{title}</p>
      <p className="ui-body mx-auto mt-1 max-w-sm leading-6 text-[color:var(--ui-text-muted)]">{text}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function CoupleWorldPage({ mode = "home" }: { mode?: CoupleMode }) {
  const { isGuest, openAuth, user } = useAuth();
  const { notify } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [tasks, setTasks] = useState<CoupleTask[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [questionBundle, setQuestionBundle] = useState<QuestionBundle | null>(null);
  const [quizGames, setQuizGames] = useState<QuizGame[]>([]);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [albums, setAlbums] = useState<CoupleAlbum[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<AlbumPhoto | null>(null);
  const [openMemory, setOpenMemory] = useState<Memory | null>(null);
  const [memoryComposerOpen, setMemoryComposerOpen] = useState(false);
  const [albumPhotoComposerOpen, setAlbumPhotoComposerOpen] = useState(false);
  const [albumComposerOpen, setAlbumComposerOpen] = useState(false);
  const [calendarComposerOpen, setCalendarComposerOpen] = useState(false);
  const [quizComposerOpen, setQuizComposerOpen] = useState(false);
  const [quizStep, setQuizStep] = useState<1 | 2 | 3>(1);
  const [quizDraftQuestions, setQuizDraftQuestions] = useState<QuizGameQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormState>({});
  // mốc thời gian hiện tại, lấy 1 lần khi mount (tránh gọi Date.now() trong render — react-hooks/purity)
  const [nowTs] = useState(() => Date.now());
  const [openLetter, setOpenLetter] = useState<Letter | null>(null);
  const [bucket, setBucket] = useState<BucketItem[]>([]);
  const [wallet, setWallet] = useState<WalletEntry[]>([]);
  const [stats, setStats] = useState<CoupleStats | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  const activeMeta = modeMeta[mode];
  const ActiveIcon = activeMeta.icon;
  const days = daysTogether(room?.anniversaryDate);

  const selectedAlbum = useMemo(
    () => albums.find((album) => album.id === selectedAlbumId) ?? null,
    [albums, selectedAlbumId]
  );
  const sortedCalendarEvents = useMemo(
    () =>
      calendarEvents
        .filter((event) => event.startsAt)
        .sort((a, b) => new Date(a.startsAt as string).getTime() - new Date(b.startsAt as string).getTime()),
    [calendarEvents]
  );
  const upcomingEvents = useMemo(
    () => sortedCalendarEvents.filter((event) => new Date(event.startsAt as string).getTime() >= startOfDay(nowTs)),
    [sortedCalendarEvents, nowTs]
  );
  const pastEvents = useMemo(
    () =>
      sortedCalendarEvents
        .filter((event) => new Date(event.startsAt as string).getTime() < startOfDay(nowTs))
        .reverse(),
    [sortedCalendarEvents, nowTs]
  );
  const nextCalendarEvent = upcomingEvents[0] ?? null;
  const latestPhoto = useMemo(() => {
    const photos = albums.flatMap((album) => album.photos ?? []);
    return [...photos].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())[0] ?? null;
  }, [albums]);
  const latestLetter = useMemo(
    () => [...letters].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())[0] ?? null,
    [letters]
  );
  async function loadRoomOnly() {
    const nextRoom = await authRequest<Room | null>("/room");
    setRoom(nextRoom);
    return nextRoom;
  }

  async function loadAll() {
    if (isGuest) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const nextRoom = await loadRoomOnly();

      if (!nextRoom) {
        setSummary(null);
        return;
      }

      const [summaryData, memoryData, songData, taskData, calendarData, letterData, questionData, quizGameData, moodData, albumData, bucketData, walletData, statsData, challengeData] = await Promise.all([
        authRequest<Summary>("/couple/summary"),
        authRequest<Memory[]>("/memories"),
        authRequest<Song[]>("/music"),
        authRequest<CoupleTask[]>("/tasks"),
        authRequest<CalendarEvent[]>("/calendar-events"),
        authRequest<Letter[]>("/letters"),
        authRequest<QuestionBundle>("/questions/today"),
        authRequest<QuizGame[]>("/quiz-games"),
        authRequest<Mood[]>("/moods/today"),
        authRequest<CoupleAlbum[]>("/albums"),
        authRequest<BucketItem[]>("/bucket-list"),
        authRequest<WalletEntry[]>("/wallet"),
        authRequest<CoupleStats>("/couple/stats"),
        authRequest<Challenge[]>("/challenges")
      ]);

      setSummary(summaryData);
      setMemories(memoryData);
      setSongs(songData);
      setTasks(taskData);
      setCalendarEvents(calendarData);
      setLetters(letterData);
      setQuestionBundle(questionData);
      setQuizGames(quizGameData);
      setMoods(moodData);
      setAlbums(albumData);
      setBucket(bucketData);
      setWallet(walletData);
      setStats(statsData);
      setChallenges(challengeData);
    } catch (error) {
      notify({ tone: "error", title: "Không tải được dữ liệu", message: error instanceof Error ? error.message : "Kiểm tra backend và database." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- nạp dữ liệu khi mount/đổi guest (setLoading nằm trong loader async, cố ý)
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest]);

  // Đóng popup chi tiết kỷ niệm bằng phím Esc (A11y)
  useEffect(() => {
    if (!openMemory) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMemory(null);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openMemory]);

  async function mutate<T>(message: string, action: () => Promise<T>, after?: (data: T) => void, onSuccess?: () => void) {
    setBusy(true);
    try {
      const data = await action();
      after?.(data);
      setForm({});
      notify({ tone: "success", title: message });
      await loadAll();
      onSuccess?.();
    } catch (error) {
      notify({ tone: "error", title: "Chưa lưu được", message: error instanceof Error ? error.message : "Thử lại sau nhé." });
    } finally {
      setBusy(false);
    }
  }

  function addDraftQuestion() {
    const questionText = form.draftQuestionText?.trim();
    const optionA = form.draftOptionA?.trim();
    const optionB = form.draftOptionB?.trim();
    const optionC = form.draftOptionC?.trim();
    const optionD = form.draftOptionD?.trim();
    const correctOption = (form.draftCorrectOption as QuizOptionKey | undefined) ?? "A";

    if (!questionText || !optionA || !optionB) {
      notify({ tone: "error", title: "Thiếu nội dung câu hỏi", message: "Mỗi câu cần nội dung, lựa chọn A và lựa chọn B." });
      return;
    }

    const options = [
      { key: "A" as const, text: optionA },
      { key: "B" as const, text: optionB },
      optionC ? { key: "C" as const, text: optionC } : null,
      optionD ? { key: "D" as const, text: optionD } : null
    ].filter((option): option is { key: QuizOptionKey; text: string } => Boolean(option));

    if (!options.some((option) => option.key === correctOption)) {
      notify({ tone: "error", title: "Đáp án đúng chưa khớp", message: "Đáp án đúng phải là một lựa chọn đang có nội dung." });
      return;
    }

    setQuizDraftQuestions((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        questionText,
        options,
        correctOption,
        sortOrder: items.length
      }
    ]);
    setForm((next) => ({
      ...next,
      draftQuestionText: "",
      draftOptionA: "",
      draftOptionB: "",
      draftOptionC: "",
      draftOptionD: "",
      draftCorrectOption: "A"
    }));
  }

  function resetQuizComposer() {
    setQuizComposerOpen(false);
    setQuizStep(1);
    setQuizDraftQuestions([]);
  }

  if (isGuest) {
    return (
      <section className={panelClass}>
        <h1 className="ui-h1 text-white">Chỉ hai đứa mình thấy nơi này</h1>
        <p className="ui-body mt-3 max-w-xl leading-6 text-[color:var(--ui-text-muted)]">Đăng nhập để tạo hoặc vào phòng riêng. Dữ liệu trong phòng được lưu theo tài khoản và phòng của cặp đôi.</p>
        <button type="button" onClick={openAuth} className={cn(primaryButton, "mt-5")}>Đăng nhập / Đăng ký</button>
      </section>
    );
  }

  if (loading) {
    return (
      <section className={panelClass}>
        <div className="ui-body flex min-h-52 items-center justify-center gap-3 text-[color:var(--ui-text-muted)]">
          <Loader2 size={18} className="animate-spin" />
          Đang mở cửa thế giới nhỏ...
        </div>
      </section>
    );
  }

  if (!room) {
    return <RoomGate onChanged={loadAll} />;
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-5 text-white">
      <header className="ui-section flex flex-wrap items-center gap-4 sm:gap-5">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[var(--ui-radius-md)] border border-white/12 bg-white/8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={createMediaUrl(room.coupleAvatarUrl) ?? pickCouplePhoto(room.id)} alt={room.roomName} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="ui-eyebrow">Phòng riêng</p>
          {/* Không lặp tên phòng (đã có ở sidebar) — hero hiện tên hai người */}
          <h1 className="mt-1 truncate text-[17px] font-bold text-white">
            {room.members.map(getMemberLabel).join(" 💞 ") || room.roomName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="ui-pill"><Heart size={12} className="text-[color:var(--ui-accent)]" /> {days ?? "--"} ngày</span>
            <span className="ui-pill"><Home size={12} className="text-[color:var(--ui-accent)]" /> {room.memberCount}/2</span>
            {room.status === "waiting" ? (
              <span className="ui-pill text-[color:var(--ui-accent)]">
                <KeyRound size={12} /> Mã: <span className="font-mono tracking-widest">{room.inviteCode}</span>
              </span>
            ) : null}
          </div>
        </div>
        <AvatarPair room={room} />
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="grid gap-5">
          <div className="ui-section flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--ui-radius-sm)] border border-white/10 bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]">
              <ActiveIcon size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="ui-h2 text-white">{activeMeta.label}</h2>
              <p className="ui-body mt-0.5 text-[color:var(--ui-text-muted)]">{activeMeta.hint}</p>
            </div>
          </div>

          {mode === "home" ? (
            <div className="grid gap-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <Link href="/calendar" className={cn(panelClass, "cosmic-hover-lift group flex flex-col gap-2")}>
                  <div className="flex items-center justify-between">
                    <p className="ui-eyebrow flex items-center gap-1.5"><CalendarDays size={12} /> Lịch hẹn kế tiếp</p>
                    <ArrowRight size={15} className="text-[color:var(--ui-text-soft)] transition group-hover:translate-x-0.5 group-hover:text-white" />
                  </div>
                  {nextCalendarEvent ? (
                    <>
                      <p className="ui-h3 truncate text-white">{nextCalendarEvent.title}</p>
                      <p className="ui-caption text-[color:var(--ui-text-muted)]">
                        {relativeDayLabel(new Date(nextCalendarEvent.startsAt as string), nowTs)} · {formatEventTime(new Date(nextCalendarEvent.startsAt as string))}
                      </p>
                    </>
                  ) : (
                    <p className="ui-caption text-[color:var(--ui-text-soft)]">Chưa có lịch — thêm một kế hoạch nhé.</p>
                  )}
                </Link>

                <Link href="/album" className={cn(panelClass, "cosmic-hover-lift group flex flex-col gap-2")}>
                  <div className="flex items-center justify-between">
                    <p className="ui-eyebrow flex items-center gap-1.5"><Album size={12} /> Ảnh mới nhất</p>
                    <ArrowRight size={15} className="text-[color:var(--ui-text-soft)] transition group-hover:translate-x-0.5 group-hover:text-white" />
                  </div>
                  {latestPhoto ? (
                    <div className="flex items-center gap-3">
                      <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/12 bg-white/8">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={createMediaUrl(latestPhoto.imageUrl) ?? latestPhoto.imageUrl} alt={latestPhoto.caption ?? "Ảnh mới"} className="h-full w-full object-cover" />
                      </span>
                      <p className="ui-caption line-clamp-2 text-[color:var(--ui-text-muted)]">{latestPhoto.caption || "Khoảnh khắc mới trong album"}</p>
                    </div>
                  ) : (
                    <p className="ui-caption text-[color:var(--ui-text-soft)]">Chưa có ảnh — thêm khoảnh khắc đầu tiên.</p>
                  )}
                </Link>

                <Link href="/letters" className={cn(panelClass, "cosmic-hover-lift group flex flex-col gap-2")}>
                  <div className="flex items-center justify-between">
                    <p className="ui-eyebrow flex items-center gap-1.5"><LetterText size={12} /> Lời nhắn mới</p>
                    <ArrowRight size={15} className="text-[color:var(--ui-text-soft)] transition group-hover:translate-x-0.5 group-hover:text-white" />
                  </div>
                  {latestLetter ? (
                    <>
                      <p className="ui-h3 truncate text-white">{latestLetter.title}</p>
                      <p className="ui-caption line-clamp-2 text-[color:var(--ui-text-muted)]">
                        {latestLetter.isSecret ? "💌 Thư bí mật, mở ở mục Lời nhắn" : latestLetter.content.slice(0, 90) || "Một lời nhắn mới"}
                      </p>
                    </>
                  ) : (
                    <p className="ui-caption text-[color:var(--ui-text-soft)]">Chưa có lời nhắn — viết đôi dòng cho người ấy.</p>
                  )}
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className={panelClass}>
                  <h3 className="ui-h3">Hôm nay cậu thế nào?</h3>
                  <InlineForm
                    title="Lưu mood hôm nay"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void mutate("Đã lưu mood", () => authRequest<Mood[]>("/moods/today", { method: "PUT", body: JSON.stringify({ mood: form.mood, note: form.note }) }), setMoods);
                    }}
                  >
                    <input className={fieldClass} placeholder="Vui, nhớ, bình yên..." value={form.mood ?? ""} onChange={(event) => setForm((next) => ({ ...next, mood: event.target.value }))} />
                    <input className={fieldClass} placeholder="Một dòng nhỏ nếu muốn" value={form.note ?? ""} onChange={(event) => setForm((next) => ({ ...next, note: event.target.value }))} />
                    <button className={primaryButton} disabled={busy}>Lưu mood</button>
                  </InlineForm>
                  <div className="mt-4 grid gap-2">
                    {moods.length ? moods.map((mood) => (
                      <div key={mood.id} className="ui-card text-[13.5px] font-semibold text-[color:var(--ui-text-muted)]">
                        <b className="text-white">{mood.user.name}</b>: {mood.mood}{mood.note ? ` - ${mood.note}` : ""}
                      </div>
                    )) : (
                      <EmptyState
                        icon={Heart}
                        title="Chưa ai lưu mood hôm nay"
                        text="Một dòng mood nhỏ giúp người ấy biết hôm nay nên ở cạnh cậu thế nào."
                      />
                    )}
                  </div>
                </div>
                <div className={panelClass}>
                  <h3 className="ui-h3">Bài hát hôm nay</h3>
                  {summary?.currentSong ? (
                    <div className="ui-card mt-3">
                      <p className="ui-h3 text-white">{summary.currentSong.title}</p>
                      <p className="ui-caption mt-1 text-[color:var(--ui-text-soft)]">{summary.currentSong.artist ?? "Một bài hát được gửi bằng cảm xúc"}</p>
                      <SongEmbed song={summary.currentSong} />
                    </div>
                  ) : (
                    <EmptyState
                      icon={Music2}
                      title="Chưa có bài hát nào"
                      text="Gửi một bài hát để căn phòng có âm thanh riêng của hôm nay."
                      action={<Link href="/music" className={primaryButton}><Music2 size={16} /> Gửi bài hát</Link>}
                    />
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className={panelClass}>
                  <p className="ui-eyebrow">Kỷ niệm</p>
                  <p className="ui-stat-num mt-2 text-white">{memories.length}</p>
                  <p className="ui-caption mt-1 text-[color:var(--ui-text-soft)]">mảnh ghép đã lưu</p>
                </div>
                <div className={panelClass}>
                  <p className="ui-eyebrow">Việc đôi đang chờ</p>
                  <p className="ui-stat-num mt-2 text-white">{tasks.filter((task) => task.status !== "done").length}</p>
                  <p className="ui-caption mt-1 text-[color:var(--ui-text-soft)]">điều muốn làm cùng nhau</p>
                </div>
                <div className={panelClass}>
                  <p className="ui-eyebrow">Tâm sự hôm nay</p>
                  <p className="ui-body mt-2 text-[color:var(--ui-text-muted)]">{summary?.dailyQuestion?.question ?? "Chưa có câu hỏi."}</p>
                </div>
              </div>
            </div>
          ) : null}

          {mode === "memories" ? (
            <div className="grid gap-4">
              <div className={cn(panelClass, "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between")}>
                <div>
                  <p className="ui-eyebrow">Kỷ niệm</p>
                  <h3 className="ui-h2 mt-1 text-white">Kỷ niệm của chúng mình</h3>
                  <p className="ui-body mt-1 text-[color:var(--ui-text-muted)]">Lưu ảnh, địa điểm và câu chuyện. Form mở bằng popup để trang gọn hơn.</p>
                </div>
                <button type="button" className={primaryButton} onClick={() => setMemoryComposerOpen(true)}>
                  <Plus size={16} /> Đăng thêm kỷ niệm
                </button>
              </div>
              {memories.length ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {memories.map((memory) => {
                    const memoryImage = memory.imageUrl ? createMediaUrl(memory.imageUrl) ?? memory.imageUrl : pickCouplePhoto(memory.id);

                    return (
                      <button
                        key={memory.id}
                        type="button"
                        onClick={() => setOpenMemory(memory)}
                        aria-label={`Xem kỷ niệm ${memory.title}`}
                        className="group relative overflow-hidden rounded-[var(--ui-radius-md)] bg-[var(--ui-bg-deep)] text-left ring-1 ring-white/10 transition hover:ring-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-accent)]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={memoryImage} alt={memory.title} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.05]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#070817]/85 via-transparent to-transparent opacity-80" />
                        {memory.placeName ? (
                          <>
                            {/* scrim tối ở đỉnh để pill địa điểm luôn đọc rõ kể cả trên ảnh sáng (a11y) */}
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#070817]/70 to-transparent" aria-hidden="true" />
                            <span className="ui-pill absolute left-2 top-2 inline-flex items-center gap-1 backdrop-blur">
                              <span>Địa điểm</span>
                              <span className="line-clamp-1 max-w-[120px]">{memory.placeName}</span>
                            </span>
                          </>
                        ) : null}
                        <div className="absolute inset-x-0 bottom-0 p-3">
                          <p className="ui-caption line-clamp-1 font-semibold text-white">{memory.title}</p>
                          <p className="ui-caption mt-0.5 text-[color:var(--ui-text-muted)]">{formatDate(memory.memoryDate)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
              {!memories.length ? (
                <EmptyState
                  action={<button type="button" className={primaryButton} onClick={() => setMemoryComposerOpen(true)}><Plus size={16} /> Đăng kỷ niệm đầu tiên</button>}
                  icon={CalendarHeart}
                  title="Chưa có kỷ niệm nào"
                  text="Lưu một tấm ảnh, nơi đã đi qua, hoặc một chuyện nhỏ đáng nhớ."
                />
              ) : null}
            </div>
          ) : null}

          {mode === "calendar" ? (
            <div className="grid gap-4">
              <section className="ui-section overflow-hidden p-0">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/8 p-4 sm:p-5">
                  <div className="min-w-0">
                    <p className="ui-eyebrow">Lịch hẹn</p>
                    <h3 className="ui-h1 mt-1 text-white">Lịch hẹn của hai đứa</h3>
                    <p className="ui-body mt-1 text-[color:var(--ui-text-muted)]">Bấm vào ngày để thêm, bấm vào sự kiện để sửa.</p>
                    <p className="ui-caption mt-2 text-[color:var(--ui-text-soft)]">
                      Hiện có {upcomingEvents.length} sự kiện sắp tới{pastEvents.length ? ` · ${pastEvents.length} đã qua` : ""}.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`${primaryButton} shrink-0`}
                    onClick={() => {
                      setForm((next) => ({ ...next, startsAt: toInputDateTime(new Date()), eventTitle: "", eventType: "date", eventDescription: "" }));
                      setCalendarComposerOpen(true);
                    }}
                  >
                    <Plus size={16} /> Thêm lịch hẹn
                  </button>
                </div>
                <div className="p-3 sm:p-4">
                  <CoupleCalendarBoard
                    events={calendarEvents
                      .filter((event) => event.startsAt)
                      .map((event) => ({
                        id: event.id,
                        title: event.title,
                        start: event.startsAt as string,
                        calendarId: event.eventType,
                        description: event.description
                      }))}
                    onSlotClick={(iso) => {
                      setForm((next) => ({ ...next, startsAt: iso, eventTitle: "", eventType: "date", eventDescription: "" }));
                      setCalendarComposerOpen(true);
                    }}
                    onEventClick={(eventId) => {
                      const found = calendarEvents.find((event) => event.id === eventId);
                      if (!found) return;
                      setForm((next) => ({
                        ...next,
                        eventTitle: found.title,
                        eventType: found.eventType,
                        startsAt: found.startsAt ? toInputDateTime(new Date(found.startsAt)) : "",
                        eventDescription: found.description ?? ""
                      }));
                      setCalendarComposerOpen(true);
                    }}
                  />
                </div>
              </section>

              {nextCalendarEvent
                ? (() => {
                    const meta = calendarEventMeta[nextCalendarEvent.eventType];
                    const HeroIcon = meta.icon;
                    const when = new Date(nextCalendarEvent.startsAt as string);

                    return (
                      <section className="ui-section relative overflow-hidden">
                        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ background: meta.color }} />
                        <p className="ui-eyebrow">Sự kiện kế tiếp</p>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
                              style={{ backgroundColor: `${meta.color}26`, color: meta.color }}
                            >
                              <HeroIcon size={22} aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <h3 className="ui-h2 truncate text-white">{nextCalendarEvent.title}</h3>
                              <p className="ui-caption mt-0.5 text-[color:var(--ui-text-muted)]">
                                {meta.label} · {formatEventTime(when)}
                              </p>
                            </div>
                          </div>
                          <span
                            className="shrink-0 rounded-full px-4 py-2 text-sm font-extrabold"
                            style={{ backgroundColor: `${meta.color}24`, color: meta.color }}
                          >
                            {relativeDayLabel(when, nowTs)}
                          </span>
                        </div>
                      </section>
                    );
                  })()
                : null}

              <section className="ui-section">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="ui-h2 text-white">Sắp tới</h3>
                  <span className="ui-pill">{upcomingEvents.length} sự kiện</span>
                </div>
                {upcomingEvents.length ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {upcomingEvents.slice(0, 9).map((event) => {
                      const meta = calendarEventMeta[event.eventType];
                      const Icon = meta.icon;
                      const when = new Date(event.startsAt as string);

                      return (
                        <article key={event.id} className="ui-card relative overflow-hidden pl-4">
                          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5" style={{ background: meta.color }} />
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="ui-eyebrow flex items-center gap-1.5" style={{ color: meta.color }}>
                                <Icon size={12} aria-hidden="true" /> {meta.label}
                              </p>
                              <h4 className="ui-h3 mt-1 truncate text-white">{event.title}</h4>
                              <p className="ui-caption mt-1 text-[color:var(--ui-text-muted)]">{formatEventTime(when)}</p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <span
                                className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-extrabold"
                                style={{ backgroundColor: `${meta.color}24`, color: meta.color }}
                              >
                                {relativeDayLabel(when, nowTs)}
                              </span>
                              <button
                                className={softButton}
                                type="button"
                                onClick={() => void mutate("Đã xóa lịch hẹn", () => authRequest(`/calendar-events/${event.id}`, { method: "DELETE" }))}
                                aria-label="Xóa lịch hẹn"
                              >
                                <Trash2 size={14} aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-3">
                    <EmptyState
                      icon={CalendarDays}
                      title={calendarEvents.length ? "Chưa có lịch sắp tới" : "Chưa có lịch hẹn"}
                      text={
                        calendarEvents.length
                          ? "Các sự kiện trước đó đã qua rồi. Lên kế hoạch mới cho hai đứa nhé."
                          : "Bấm vào ngày trên lịch hoặc nút Thêm lịch hẹn để bắt đầu."
                      }
                    />
                  </div>
                )}
              </section>

              {pastEvents.length ? (
                <section className="ui-section">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="ui-h2 text-white">Đã qua</h3>
                    <span className="ui-pill">{pastEvents.length} kỷ niệm</span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {pastEvents.slice(0, 5).map((event) => {
                      const meta = calendarEventMeta[event.eventType];
                      const Icon = meta.icon;
                      const when = new Date(event.startsAt as string);

                      return (
                        <div
                          key={event.id}
                          className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2"
                        >
                          <span
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl"
                            style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}
                          >
                            <Icon size={14} aria-hidden="true" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white/90">{event.title}</p>
                            <p className="text-[11.5px] font-medium text-[color:var(--ui-text-soft)]">{formatEventTime(when)}</p>
                          </div>
                          <span className="shrink-0 text-[11px] font-semibold text-[color:var(--ui-text-soft)]">
                            {relativeDayLabel(when, nowTs)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}

          {mode === "music" ? (
            <div className="grid gap-4">
              <InlineForm
                title="Gửi cậu một bài hát"
                onSubmit={(event) => {
                  event.preventDefault();
                  void mutate("Đã thêm bài hát", () => authRequest<Song[]>("/music", { method: "POST", body: JSON.stringify({ title: form.title, artist: form.artist, sourceType: form.sourceType || "custom", sourceUrl: form.sourceUrl, message: form.message }) }), setSongs);
                }}
              >
                <input className={fieldClass} placeholder="Tên bài hát" value={form.title ?? ""} onChange={(event) => setForm((next) => ({ ...next, title: event.target.value }))} />
                <input className={fieldClass} placeholder="Ca sĩ" value={form.artist ?? ""} onChange={(event) => setForm((next) => ({ ...next, artist: event.target.value }))} />
                <select className={fieldClass} value={form.sourceType ?? "custom"} onChange={(event) => setForm((next) => ({ ...next, sourceType: event.target.value }))}>
                  <option value="soundcloud">SoundCloud</option>
                  <option value="youtube">YouTube</option>
                  <option value="spotify">Spotify</option>
                  <option value="custom">Link khác</option>
                </select>
                <input className={fieldClass} placeholder="Link bài hát" value={form.sourceUrl ?? ""} onChange={(event) => setForm((next) => ({ ...next, sourceUrl: event.target.value }))} />
                <input className={fieldClass} placeholder="Lời nhắn kèm bài hát" value={form.message ?? ""} onChange={(event) => setForm((next) => ({ ...next, message: event.target.value }))} />
                <button className={primaryButton} disabled={busy}>Thêm vào playlist</button>
              </InlineForm>
              {songs.map((song) => (
                <article key={song.id} className={panelClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="ui-h3 truncate text-white">{song.title}</h3>
                      <p className="ui-caption mt-1 text-[color:var(--ui-text-soft)]">{song.artist ?? song.addedByName ?? "Bài hát của phòng"}</p>
                    </div>
                    <button className={softButton} onClick={() => void mutate("Đã xóa bài hát", () => authRequest(`/music/${song.id}`, { method: "DELETE" }))}><Trash2 size={15} /></button>
                  </div>
                  {song.message ? <p className="ui-card mt-3 text-[13.5px] font-semibold text-[color:var(--ui-text-muted)]">{song.message}</p> : null}
                  <SongEmbed song={song} />
                </article>
              ))}
              {!songs.length ? (
                <EmptyState
                  icon={Music2}
                  title="Playlist đang trống"
                  text="Thêm một link YouTube, SoundCloud hoặc Spotify kèm lời nhắn cho người ấy."
                />
              ) : null}
            </div>
          ) : null}

          {mode === "tasks" ? (
            <div className="grid gap-4">
              <InlineForm
                title="Một điều muốn làm cùng cậu"
                onSubmit={(event) => {
                  event.preventDefault();
                  void mutate("Đã thêm việc đôi", () => authRequest<CoupleTask[]>("/tasks", { method: "POST", body: JSON.stringify({ title: form.title, category: form.category, description: form.description }) }), setTasks);
                }}
              >
                <input className={fieldClass} placeholder="Điều muốn làm" value={form.title ?? ""} onChange={(event) => setForm((next) => ({ ...next, title: event.target.value }))} />
                <input className={fieldClass} placeholder="Nhóm nhỏ: hẹn hò, học tập, du lịch..." value={form.category ?? ""} onChange={(event) => setForm((next) => ({ ...next, category: event.target.value }))} />
                <textarea className={cn(fieldClass, "min-h-24 py-3")} placeholder="Mô tả nếu cần" value={form.description ?? ""} onChange={(event) => setForm((next) => ({ ...next, description: event.target.value }))} />
                <button className={primaryButton} disabled={busy}>Thêm vào checklist</button>
              </InlineForm>
              {tasks.map((task) => (
                <div key={task.id} className={cn(panelClass, task.status === "done" && "opacity-60")}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="ui-eyebrow">{task.category ?? "Việc đôi"}</p>
                      <h3 className="ui-h3 mt-1 text-white">{task.title}</h3>
                      {task.description ? <p className="ui-body mt-2 text-[color:var(--ui-text-muted)]">{task.description}</p> : null}
                    </div>
                    <div className="flex gap-2">
                      <button className={softButton} onClick={() => void mutate("Đã hoàn thành", () => authRequest(`/tasks/${task.id}/done`, { method: "PATCH" }))}><CheckCircle2 size={15} /> Xong</button>
                      <button className={softButton} onClick={() => void mutate("Đã xóa", () => authRequest(`/tasks/${task.id}`, { method: "DELETE" }))}><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              ))}
              {!tasks.length ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="Chưa có việc đôi"
                  text="Thêm một điều hai đứa muốn làm cùng nhau, từ nhỏ xíu đến thật đặc biệt."
                />
              ) : null}
            </div>
          ) : null}

          {mode === "letters" ? (
            <div className="grid gap-4">
              <InlineForm
                title="Viết một lá thư"
                onSubmit={(event) => {
                  event.preventDefault();
                  void mutate(
                    "Đã gửi lá thư",
                    () =>
                      authRequest<Letter[]>("/letters", {
                        method: "POST",
                        body: JSON.stringify({
                          title: form.title,
                          content: form.content,
                          mood: form.mood,
                          isSecret: form.isSecret === "yes",
                          unlockAt: form.unlockAt,
                          envelope: form.envelope ?? "rose",
                          paper: form.paper ?? "cream",
                          font: form.font ?? "hand"
                        })
                      }),
                    setLetters
                  );
                }}
              >
                <input className={fieldClass} placeholder="Tiêu đề lá thư" value={form.title ?? ""} onChange={(event) => setForm((next) => ({ ...next, title: event.target.value }))} />
                <input className={fieldClass} placeholder="Tâm trạng (vd: nhớ, biết ơn...)" value={form.mood ?? ""} onChange={(event) => setForm((next) => ({ ...next, mood: event.target.value }))} />
                <div className="flex flex-wrap gap-1.5">
                  {["❤️", "💖", "🥰", "😘", "🌙", "✨", "🫶", "💌"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="rounded-lg border border-white/12 bg-white/5 px-2 py-1 text-lg transition hover:bg-white/12"
                      onClick={() => setForm((next) => ({ ...next, content: `${next.content ?? ""}${emoji}` }))}
                      aria-label={`Chèn ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <textarea className={cn(fieldClass, "min-h-36 py-3")} placeholder="Viết cho người ấy..." value={form.content ?? ""} onChange={(event) => setForm((next) => ({ ...next, content: event.target.value }))} />
                <div className="grid gap-2 sm:grid-cols-3">
                  <select className={fieldClass} value={form.envelope ?? "rose"} onChange={(event) => setForm((next) => ({ ...next, envelope: event.target.value }))} aria-label="Phong bì">
                    <option value="rose">Phong bì hồng</option>
                    <option value="ocean">Phong bì xanh</option>
                    <option value="gold">Phong bì vàng</option>
                    <option value="violet">Phong bì tím</option>
                  </select>
                  <select className={fieldClass} value={form.paper ?? "cream"} onChange={(event) => setForm((next) => ({ ...next, paper: event.target.value }))} aria-label="Giấy viết">
                    <option value="cream">Giấy kem</option>
                    <option value="lined">Giấy kẻ dòng</option>
                    <option value="starry">Giấy sao đêm</option>
                  </select>
                  <select className={fieldClass} value={form.font ?? "hand"} onChange={(event) => setForm((next) => ({ ...next, font: event.target.value }))} aria-label="Kiểu chữ">
                    <option value="hand">Chữ viết tay</option>
                    <option value="serif">Chữ cổ điển</option>
                    <option value="default">Chữ thường</option>
                  </select>
                </div>
                <input className={fieldClass} type="datetime-local" value={form.unlockAt ?? ""} onChange={(event) => setForm((next) => ({ ...next, unlockAt: event.target.value }))} aria-label="Ngày mở (nếu là thư bí mật)" />
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--ui-text-muted)]">
                  <input type="checkbox" checked={form.isSecret === "yes"} onChange={(event) => setForm((next) => ({ ...next, isSecret: event.target.checked ? "yes" : "" }))} />
                  Thư bí mật, chỉ mở được sau ngày đã chọn
                </label>
                <button className={primaryButton} disabled={busy}>Gửi lá thư 💌</button>
              </InlineForm>

              {letters.length ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {letters.map((letter) => {
                    // isOpened = NGƯỜI NHẬN đã mở (opened_at chỉ set cho người không phải sender).
                    // => thư mình gửi: isOpened true = "người ấy đã xem"; thư người ấy gửi: isOpened true = mình đã mở.
                    const fromPartner = letter.senderId !== user?.id;
                    const isNew = fromPartner && !letter.isOpened;

                    return (
                      <button
                        key={letter.id}
                        type="button"
                        onClick={() => {
                          setOpenLetter(letter);
                          // người nhận mở thư của người ấy -> đánh dấu đã xem để không bị hỏi lại
                          if (isNew) {
                            void authRequest<Letter[]>(`/letters/${letter.id}/open`, { method: "PATCH" })
                              .then(setLetters)
                              .catch(() => undefined);
                          }
                        }}
                        className={cn(
                          "letter-envelope text-left",
                          `letter-envelope-${letter.envelope ?? "rose"}`,
                          isNew && "letter-envelope-new"
                        )}
                      >
                        <span className="letter-seal">{letter.isSecret ? "🔒" : "♥"}</span>
                        {isNew ? <span className="letter-badge-new">Mới</span> : null}
                        <p className="ui-caption text-white/70">{letter.mood ?? "Lời nhắn"}</p>
                        <h3 className="mt-1 truncate text-[15px] font-bold text-white">{letter.title}</h3>
                        <p className="ui-caption mt-1 text-white/60">
                          {fromPartner
                            ? `${letter.senderName ?? "Người ấy"} gửi · ${isNew ? "Nhấn để mở 💌" : "Đã mở"}`
                            : letter.isOpened
                              ? "Bạn gửi · Đã xem 👀"
                              : "Bạn gửi · Chưa mở"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={LetterText}
                  title="Góc lời nhắn còn trống"
                  text="Viết một lời nhắn ngắn, một lời hứa nhỏ, hoặc một lá thư có ngày mở."
                />
              )}

              <LetterReader
                open={Boolean(openLetter)}
                letter={openLetter}
                now={nowTs}
                onClose={() => setOpenLetter(null)}
                footer={
                  openLetter ? (
                    <button
                      type="button"
                      className={softButton}
                      onClick={() => {
                        const id = openLetter.id;
                        setOpenLetter(null);
                        setLetters((prev) => prev.filter((item) => item.id !== id));
                        void mutate("Đã xóa lá thư", () => authRequest(`/letters/${id}`, { method: "DELETE" }));
                      }}
                    >
                      <Trash2 size={14} /> Xoá thư
                    </button>
                  ) : null
                }
              />
            </div>
          ) : null}

          {mode === "questions" ? (
            <div className="grid gap-4">
              <section className="ui-section">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {["Ý nghĩa", "Câu hỏi", "Báo cáo"].map((step, index) => (
                        <span key={step} className="ui-pill">
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-white/10 text-[10px] text-white">{index + 1}</span>
                          {step}
                        </span>
                      ))}
                    </div>
                    <p className="ui-eyebrow mt-5">Tâm sự / thấu hiểu</p>
                    <h3 className="ui-h1 mt-2 max-w-3xl text-white">
                      Tạo một trò chơi nhỏ để biết hai đứa hiểu nhau tới đâu
                    </h3>
                    <p className="ui-body mt-3 max-w-2xl leading-6 text-[color:var(--ui-text-muted)]">
                      Đặt tên, viết ý nghĩa, thêm câu hỏi, chọn đáp án đúng. Người ấy bấm khởi động để chơi ở tab riêng có timer.
                    </p>
                  </div>
                  <div className="ui-card">
                    <p className="ui-h3 text-white">Cách chơi</p>
                    <div className="ui-body mt-3 grid gap-2 leading-6 text-[color:var(--ui-text-muted)]">
                      <p>1. Người tạo quiz viết điều muốn hiểu hơn.</p>
                      <p>2. Người chơi trả lời từng câu trong thời gian giới hạn.</p>
                      <p>3. Hệ thống chấm điểm và lưu báo cáo cho phòng.</p>
                    </div>
                    <button type="button" className={cn(primaryButton, "mt-4 w-full")} onClick={() => setQuizComposerOpen(true)}>
                      <Plus size={16} /> Tạo trò chơi
                    </button>
                  </div>
                </div>
              </section>

              <section className="grid gap-4">
                {quizGames.map((game) => {
                  const myAttempt = game.attempts.find((attempt) => attempt.userId === user?.id) ?? null;
                  const bestScore = game.attempts.reduce((best, attempt) => Math.max(best, attempt.score), 0);

                  return (
                    <article key={game.id} className="ui-section overflow-hidden p-0">
                      <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_240px]">
                        <div className="min-w-0">
                          <p className="ui-eyebrow">
                            {game.questions.length} câu · {game.timeLimitSeconds}s/câu
                          </p>
                          <h3 className="ui-h2 mt-2 text-white">{game.title}</h3>
                          <p className="ui-body mt-2 leading-6 text-[color:var(--ui-text-muted)]">
                            {game.meaning ?? "Một trò chơi nhỏ để hiểu nhau hơn."}
                          </p>
                          <p className="ui-caption mt-3 text-[color:var(--ui-text-soft)]">Tạo bởi {game.creator.name}</p>
                        </div>
                        <div className="ui-card grid gap-2">
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="rounded-[var(--ui-radius-sm)] bg-white/8 p-3">
                              <p className="ui-stat-num text-white">{bestScore}</p>
                              <p className="ui-stat-label text-[color:var(--ui-text-soft)]">điểm cao</p>
                            </div>
                            <div className="rounded-[var(--ui-radius-sm)] bg-white/8 p-3">
                              <p className="ui-stat-num text-white">{game.attempts.length}</p>
                              <p className="ui-stat-label text-[color:var(--ui-text-soft)]">lượt chơi</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className={primaryButton}
                            onClick={() => window.open(`/quiz/${game.id}?via=web`, "_blank", "noopener,noreferrer")}
                          >
                            <Play size={16} /> Vào chơi
                          </button>
                          <button
                            type="button"
                            className={softButton}
                            onClick={() => {
                              const link = `${window.location.origin}/quiz/${game.id}`;
                              void navigator.clipboard?.writeText(link).then(
                                () => notify({ tone: "success", title: "Đã copy link mời chơi 💌" }),
                                () => notify({ tone: "error", title: "Không copy được", message: link })
                              );
                            }}
                          >
                            <Copy size={15} /> Tạo link mời
                          </button>
                        </div>
                      </div>
                      <div className="border-t border-white/8 bg-white/[0.03] p-5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="ui-eyebrow">Lịch sử chơi</p>
                          {myAttempt ? (
                            <span className="ui-pill text-[#7ee7ad]">Của cậu: {myAttempt.score}/{myAttempt.totalQuestions}</span>
                          ) : null}
                        </div>
                        {game.attempts.length ? (
                          <div className="mt-3 grid gap-2">
                            {game.attempts.slice(0, 6).map((attempt) => (
                              <div key={attempt.id} className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2">
                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--ui-accent-soft)] text-[11px] font-black text-[color:var(--ui-accent)]">
                                  {attempt.user.name.slice(0, 2).toUpperCase()}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-white">
                                  {attempt.user.name}
                                  {attempt.userId === user?.id ? " (cậu)" : ""}
                                </span>
                                <span className="shrink-0 text-[13px] font-extrabold text-white">
                                  {attempt.score}/{attempt.totalQuestions}
                                </span>
                                <span className="shrink-0 text-[11.5px] text-[color:var(--ui-text-soft)]">{attempt.durationSeconds}s</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="ui-body mt-2 text-[color:var(--ui-text-soft)]">
                            Chưa có ai chơi — bấm “Tạo link mời” gửi người ấy nhé.
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
                {!quizGames.length ? (
                  <EmptyState
                    action={<button type="button" className={primaryButton} onClick={() => setQuizComposerOpen(true)}><Plus size={16} /> Tạo trò chơi</button>}
                    icon={Sparkles}
                    title="Chưa có trò chơi nào"
                    text="Tạo một quiz nhỏ để người ấy bấm khởi động, trả lời theo thời gian và nhận báo cáo điểm."
                  />
                ) : null}
              </section>

              {questionBundle?.question ? (
                <section className={panelClass}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="ui-eyebrow">Gợi ý hôm nay</p>
                      <h3 className="ui-h2 mt-2 text-white">{questionBundle.question.question}</h3>
                      <p className="ui-caption mt-1 text-[color:var(--ui-text-soft)]">
                        {questionBundle.answers.length}/{room.memberCount} người đã trả lời.
                      </p>
                    </div>
                  </div>
                  <InlineForm
                    title="Câu trả lời của cậu"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void mutate("Đã lưu câu trả lời", () => authRequest<QuestionBundle>("/questions/answers", { method: "POST", body: JSON.stringify({ questionId: questionBundle.question?.id, answer: form.answer }) }), setQuestionBundle);
                    }}
                  >
                    <textarea className={cn(fieldClass, "min-h-28 py-3")} placeholder="Trả lời thật lòng một chút..." value={form.answer ?? ""} onChange={(event) => setForm((next) => ({ ...next, answer: event.target.value }))} />
                    <button className={primaryButton} disabled={busy}>Lưu câu trả lời</button>
                  </InlineForm>
                </section>
              ) : null}
            </div>
          ) : null}

          {mode === "album" ? (
            <div className="grid gap-4">
              {!selectedAlbum ? (
                <>
                  <section className="ui-section">
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
                      <div>
                        <p className="ui-eyebrow">Album riêng</p>
                        <h3 className="ui-h1 mt-2 text-white">Kho ảnh của hai đứa</h3>
                        <p className="ui-body mt-2 max-w-2xl leading-6 text-[color:var(--ui-text-muted)]">
                          Gom ảnh theo thư mục. Form thêm mới mở bằng popup để trang không bị rối.
                        </p>
                      </div>
                      <div className="ui-card grid gap-3">
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="rounded-[var(--ui-radius-sm)] bg-white/8 p-3">
                            <p className="ui-stat-num text-white">{albums.length}</p>
                            <p className="ui-stat-label text-[color:var(--ui-text-soft)]">thư mục</p>
                          </div>
                          <div className="rounded-[var(--ui-radius-sm)] bg-white/8 p-3">
                            <p className="ui-stat-num text-white">{albums.reduce((total, album) => total + album.photos.length, 0)}</p>
                            <p className="ui-stat-label text-[color:var(--ui-text-soft)]">ảnh</p>
                          </div>
                        </div>
                        <button type="button" className={primaryButton} onClick={() => setAlbumComposerOpen(true)}>
                          <Plus size={16} /> Tạo thư mục
                        </button>
                      </div>
                    </div>
                  </section>

                  <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                    {albums.map((album) => {
                      const cover = album.photos[0];
                      const coverImage = cover ? createMediaUrl(cover.imageUrl) ?? cover.imageUrl : pickCouplePhoto(album.id);

                      return (
                        <button
                          key={album.id}
                          type="button"
                          onClick={() => setSelectedAlbumId(album.id)}
                          className="group relative overflow-hidden rounded-[var(--ui-radius-lg)] border border-white/10 bg-white/[0.04] text-left transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]"
                        >
                          <div className="relative aspect-[4/3] bg-[var(--ui-bg-deep)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={coverImage} alt={album.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#070817]/90 via-[#070817]/20 to-transparent" />
                            {!cover ? (
                              <div className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-[var(--ui-radius-sm)] bg-white/12 text-white backdrop-blur-md">
                                <FolderOpen size={20} />
                              </div>
                            ) : null}
                            <div className="absolute inset-x-0 bottom-0 p-4">
                              <span className="ui-pill">
                                <FolderOpen size={12} /> {album.photos.length} ảnh
                              </span>
                              <h3 className="ui-h3 mt-3 line-clamp-1 text-white">{album.title}</h3>
                              <p className="ui-caption mt-1 line-clamp-2 leading-5 text-[color:var(--ui-text-muted)]">
                                {album.description ?? "Một thư mục ảnh riêng của tụi mình."}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    {!albums.length ? (
                      <div className="sm:col-span-2 2xl:col-span-3">
                        <EmptyState
                          action={<button type="button" className={primaryButton} onClick={() => setAlbumComposerOpen(true)}><Plus size={16} /> Tạo thư mục đầu tiên</button>}
                          icon={FolderOpen}
                          title="Chưa có thư mục ảnh"
                          text="Tạo một thư mục rồi thêm ảnh vào trong, trang sẽ gọn hơn thay vì đổ mọi thứ ra ngoài."
                        />
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <section className="ui-section overflow-hidden p-0">
                  <div className="border-b border-white/10 p-4 sm:p-5">
                    <button type="button" className={softButton} onClick={() => setSelectedAlbumId(null)}>
                      <ArrowLeft size={16} /> Quay lại album
                    </button>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div className="min-w-0">
                        <p className="ui-eyebrow">Thư mục ảnh</p>
                        <h3 className="ui-h1 mt-1 truncate text-white">{selectedAlbum.title}</h3>
                        <p className="ui-body mt-2 max-w-2xl leading-6 text-[color:var(--ui-text-muted)]">{selectedAlbum.description ?? "Ảnh riêng trong thư mục này."}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="ui-pill">{selectedAlbum.photos.length} ảnh</span>
                        <button type="button" className={primaryButton} onClick={() => setAlbumPhotoComposerOpen(true)}>
                          <ImagePlus size={16} /> Thêm ảnh
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                      {selectedAlbum.photos.map((photo) => (
                        <button key={photo.id} type="button" className="group relative overflow-hidden rounded-[var(--ui-radius-md)] bg-[var(--ui-bg-deep)] text-left ring-1 ring-white/10" onClick={() => setSelectedPhoto(photo)}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={createMediaUrl(photo.imageUrl) ?? photo.imageUrl} alt={photo.caption ?? selectedAlbum.title} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.05]" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#070817]/85 via-transparent to-transparent opacity-80" />
                          <div className="absolute inset-x-0 bottom-0 p-3">
                            <p className="ui-caption line-clamp-1 text-white">{photo.caption ?? "Ảnh riêng"}</p>
                            <p className="ui-caption mt-0.5 text-[color:var(--ui-text-muted)]">{formatDate(photo.createdAt)}</p>
                          </div>
                        </button>
                      ))}
                      {!selectedAlbum.photos.length ? (
                        <div className="col-span-full">
                          <EmptyState
                            action={<button type="button" className={primaryButton} onClick={() => setAlbumPhotoComposerOpen(true)}><ImagePlus size={16} /> Thêm ảnh</button>}
                            icon={ImagePlus}
                            title="Thư mục này chưa có ảnh"
                            text="Thêm ảnh đầu tiên. Khi có ảnh, trang sẽ hiển thị dạng lưới gọn và bấm vào để xem chi tiết."
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>
              )}
            </div>
          ) : null}

          {mode === "bucket" ? (
            <div className="grid gap-4">
              <InlineForm
                title="Thêm một điều hai đứa muốn làm cùng nhau"
                onSubmit={(event) => {
                  event.preventDefault();
                  void mutate("Đã thêm mong ước", () => authRequest<BucketItem[]>("/bucket-list", { method: "POST", body: JSON.stringify({ title: form.bucketTitle, note: form.bucketNote }) }), setBucket);
                  setForm((next) => ({ ...next, bucketTitle: "", bucketNote: "" }));
                }}
              >
                <input className={fieldClass} placeholder="Vd: Cùng nhau ngắm bình minh ở biển" value={form.bucketTitle ?? ""} onChange={(event) => setForm((next) => ({ ...next, bucketTitle: event.target.value }))} />
                <input className={fieldClass} placeholder="Ghi chú nhỏ (không bắt buộc)" value={form.bucketNote ?? ""} onChange={(event) => setForm((next) => ({ ...next, bucketNote: event.target.value }))} />
                <button className={primaryButton} disabled={busy}>Thêm vào danh sách</button>
              </InlineForm>

              {bucket.length ? (
                <div className="grid gap-2">
                  {bucket.map((item) => (
                    <div key={item.id} className={cn("ui-card flex items-center gap-3", item.isDone && "opacity-70")}>
                      <button
                        type="button"
                        aria-label={item.isDone ? "Bỏ đánh dấu hoàn thành" : "Đánh dấu hoàn thành"}
                        onClick={() => {
                          setBucket((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, isDone: !entry.isDone } : entry)));
                          void mutate("Đã cập nhật mong ước", () => authRequest<BucketItem[]>(`/bucket-list/${item.id}/toggle`, { method: "PATCH" }), setBucket);
                        }}
                        className={cn(
                          "grid h-6 w-6 shrink-0 place-items-center rounded-md border transition",
                          item.isDone ? "border-[#7ee7ad] bg-[#7ee7ad]/20 text-[#7ee7ad]" : "border-white/25 text-transparent hover:border-[color:var(--ui-accent)]"
                        )}
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-[14.5px] font-semibold text-white", item.isDone && "line-through")}>{item.title}</p>
                        {item.note ? <p className="text-[12px] text-[color:var(--ui-text-soft)]">{item.note}</p> : null}
                      </div>
                      <button
                        className={softButton}
                        type="button"
                        aria-label="Xóa mong ước"
                        onClick={() => {
                          const id = item.id;
                          setBucket((prev) => prev.filter((entry) => entry.id !== id));
                          void mutate("Đã xóa mong ước", () => authRequest(`/bucket-list/${id}`, { method: "DELETE" }));
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Star} title="Chưa có mong ước nào" text="Liệt kê những điều hai đứa muốn làm cùng nhau — đánh dấu ✓ khi đã hoàn thành." />
              )}
            </div>
          ) : null}

          {mode === "wallet"
            ? (() => {
                const total = wallet.reduce((sum, entry) => sum + entry.amount, 0);
                const byCategory = Object.entries(
                  wallet.reduce<Record<string, number>>((acc, entry) => {
                    acc[entry.category] = (acc[entry.category] ?? 0) + entry.amount;
                    return acc;
                  }, {})
                ).sort((a, b) => b[1] - a[1]);
                const byPerson = Object.entries(
                  wallet.reduce<Record<string, number>>((acc, entry) => {
                    const key = entry.creatorName ?? "Ẩn danh";
                    acc[key] = (acc[key] ?? 0) + entry.amount;
                    return acc;
                  }, {})
                );
                const fmt = (value: number) => new Intl.NumberFormat("vi-VN").format(value);

                return (
                  <div className="grid gap-4">
                    <InlineForm
                      title="Ghi một khoản chi chung"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void mutate(
                          "Đã ghi khoản chi",
                          () =>
                            authRequest<WalletEntry[]>("/wallet", {
                              method: "POST",
                              body: JSON.stringify({
                                title: form.walletTitle,
                                category: form.walletCategory ?? "Ăn uống",
                                amount: Number(form.walletAmount ?? "0"),
                                note: form.walletNote,
                                spentAt: form.walletDate
                              })
                            }),
                          setWallet
                        );
                        setForm((next) => ({ ...next, walletTitle: "", walletAmount: "", walletNote: "" }));
                      }}
                    >
                      <input className={fieldClass} placeholder="Khoản chi (vd: Vé tàu Đà Lạt)" value={form.walletTitle ?? ""} onChange={(event) => setForm((next) => ({ ...next, walletTitle: event.target.value }))} />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <select className={fieldClass} value={form.walletCategory ?? "Ăn uống"} onChange={(event) => setForm((next) => ({ ...next, walletCategory: event.target.value }))} aria-label="Mục chi">
                          {["Ăn uống", "Du lịch", "Học tập", "Sinh hoạt", "Quà tặng", "Khác"].map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                        <input className={fieldClass} type="number" min="0" inputMode="numeric" placeholder="Số tiền (đ)" value={form.walletAmount ?? ""} onChange={(event) => setForm((next) => ({ ...next, walletAmount: event.target.value }))} />
                      </div>
                      <input className={fieldClass} type="date" value={form.walletDate ?? ""} onChange={(event) => setForm((next) => ({ ...next, walletDate: event.target.value }))} aria-label="Ngày chi" />
                      <input className={fieldClass} placeholder="Ghi chú (không bắt buộc)" value={form.walletNote ?? ""} onChange={(event) => setForm((next) => ({ ...next, walletNote: event.target.value }))} />
                      <button className={primaryButton} disabled={busy}>Ghi vào ví</button>
                    </InlineForm>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className={panelClass}>
                        <p className="ui-eyebrow">Tổng chi chung</p>
                        <p className="ui-stat-num mt-2 text-white">{fmt(total)} đ</p>
                        <div className="mt-3 grid gap-2">
                          {byCategory.length ? (
                            byCategory.map(([category, amount]) => (
                              <div key={category}>
                                <div className="flex items-center justify-between text-[12.5px]">
                                  <span className="text-[color:var(--ui-text-muted)]">{category}</span>
                                  <span className="font-bold text-white">{fmt(amount)} đ</span>
                                </div>
                                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/8">
                                  <div className="h-full rounded-full bg-[color:var(--ui-accent)]" style={{ width: `${total ? Math.round((amount / total) * 100) : 0}%` }} />
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="ui-caption text-[color:var(--ui-text-soft)]">Chưa có khoản chi nào.</p>
                          )}
                        </div>
                      </div>
                      <div className={panelClass}>
                        <p className="ui-eyebrow">Ai đã chi</p>
                        <div className="mt-3 grid gap-2">
                          {byPerson.length ? (
                            byPerson.map(([name, amount]) => (
                              <div key={name} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-[13px]">
                                <span className="text-white">{name}</span>
                                <span className="font-bold text-[color:var(--ui-accent)]">{fmt(amount)} đ</span>
                              </div>
                            ))
                          ) : (
                            <p className="ui-caption text-[color:var(--ui-text-soft)]">Chưa có dữ liệu.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {wallet.length ? (
                      <div className="grid gap-2">
                        {wallet.map((entry) => (
                          <div key={entry.id} className="ui-card flex items-center gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-[14px] font-semibold text-white">{entry.title}</p>
                              <p className="text-[11.5px] text-[color:var(--ui-text-soft)]">
                                {entry.category} · {entry.creatorName ?? "—"}
                                {entry.spentAt ? ` · ${new Date(entry.spentAt).toLocaleDateString("vi-VN")}` : ""}
                                {entry.note ? ` · ${entry.note}` : ""}
                              </p>
                            </div>
                            <span className="shrink-0 text-[14px] font-extrabold text-white">{fmt(entry.amount)} đ</span>
                            <button
                              className={softButton}
                              type="button"
                              aria-label="Xóa khoản chi"
                              onClick={() => {
                                const id = entry.id;
                                setWallet((prev) => prev.filter((item) => item.id !== id));
                                void mutate("Đã xóa khoản chi", () => authRequest(`/wallet/${id}`, { method: "DELETE" }));
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState icon={Wallet} title="Ví chung còn trống" text="Ghi lại các khoản chi chung (du lịch, ăn uống, học tập...) để cùng cân đối tài chính." />
                    )}
                  </div>
                );
              })()
            : null}

          {mode === "stats" ? (
            <div className="grid gap-4">
              <section className="ui-section">
                <p className="ui-eyebrow">Thành tựu của hai đứa</p>
                <h2 className="ui-h2 mt-1 text-white">Những con số đáng tự hào 🏆</h2>
                <p className="ui-body mt-1 text-[color:var(--ui-text-muted)]">
                  Mỗi cột mốc là một kỷ niệm hai đứa cùng vun đắp — huy hiệu sẽ sáng lên khi đạt mốc.
                </p>
              </section>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { icon: Heart, label: "Ngày đã bên nhau", value: days ?? 0, suffix: "ngày" },
                  { icon: CalendarDays, label: "Đã hẹn hò cùng nhau", value: stats?.dates ?? 0, suffix: "lần" },
                  { icon: CalendarHeart, label: "Kỷ niệm đã lưu giữ", value: stats?.memories ?? 0, suffix: "" },
                  { icon: Album, label: "Ảnh đã cất giữ", value: stats?.photos ?? 0, suffix: "" },
                  { icon: LetterText, label: "Lời nhắn đã trao", value: stats?.letters ?? 0, suffix: "" },
                  { icon: Music2, label: "Bài hát đã gửi nhau", value: stats?.songs ?? 0, suffix: "" },
                  { icon: Star, label: "Mong ước đã hoàn thành", value: stats?.bucketDone ?? 0, suffix: "" },
                  { icon: Sparkles, label: "Ngày sẻ chia tâm trạng", value: stats?.moods ?? 0, suffix: "" }
                ].map((card) => {
                  const Icon = card.icon;
                  const badge =
                    card.value >= 1000
                      ? "👑"
                      : card.value >= 500
                        ? "💎"
                        : card.value >= 100
                          ? "🥇"
                          : card.value >= 50
                            ? "🥈"
                            : card.value >= 10
                              ? "🥉"
                              : null;

                  return (
                    <div key={card.label} className={cn(panelClass, "relative flex items-center gap-4")}>
                      {badge ? (
                        <span className="absolute right-3 top-3 text-lg" title="Mốc thành tựu đã đạt">
                          {badge}
                        </span>
                      ) : null}
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--ui-accent-soft)] text-[color:var(--ui-accent)]">
                        <Icon size={22} />
                      </span>
                      <div className="min-w-0">
                        <p className="ui-stat-num text-white">
                          {new Intl.NumberFormat("vi-VN").format(card.value)}
                          {card.suffix ? <span className="ml-1 text-[13px] font-semibold text-[color:var(--ui-text-soft)]">{card.suffix}</span> : null}
                        </p>
                        <p className="ui-caption text-[color:var(--ui-text-muted)]">{card.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="ui-caption text-center text-[color:var(--ui-text-soft)]">Những con số nhỏ, kỷ niệm lớn của hai đứa mình 💫</p>
            </div>
          ) : null}

          {mode === "challenges" ? (
            <div className="grid gap-4">
              <InlineForm
                title="Tạo một thử thách cho hai đứa"
                onSubmit={(event) => {
                  event.preventDefault();
                  void mutate(
                    "Đã tạo thử thách",
                    () => authRequest<Challenge[]>("/challenges", { method: "POST", body: JSON.stringify({ title: form.challengeTitle, targetDays: Number(form.challengeTarget ?? "30") }) }),
                    setChallenges
                  );
                  setForm((next) => ({ ...next, challengeTitle: "" }));
                }}
              >
                <input className={fieldClass} placeholder="Vd: 30 ngày gửi nhau lời yêu thương" value={form.challengeTitle ?? ""} onChange={(event) => setForm((next) => ({ ...next, challengeTitle: event.target.value }))} />
                <select className={fieldClass} value={form.challengeTarget ?? "30"} onChange={(event) => setForm((next) => ({ ...next, challengeTarget: event.target.value }))} aria-label="Số ngày thử thách">
                  <option value="7">7 ngày</option>
                  <option value="21">21 ngày</option>
                  <option value="30">30 ngày</option>
                  <option value="100">100 ngày</option>
                </select>
                <button className={primaryButton} disabled={busy}>Bắt đầu thử thách</button>
              </InlineForm>

              {challenges.length ? (
                <div className="grid gap-3">
                  {challenges.map((challenge) => {
                    const pct = challenge.targetDays ? Math.min(100, Math.round((challenge.doneDays / challenge.targetDays) * 100)) : 0;
                    const finished = challenge.doneDays >= challenge.targetDays;

                    return (
                      <div key={challenge.id} className={panelClass}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="ui-h3 text-white">{challenge.title}</h3>
                            <p className="ui-caption mt-1 text-[color:var(--ui-text-soft)]">
                              {challenge.doneDays}/{challenge.targetDays} ngày
                              {challenge.streak > 0 ? ` · 🔥 ${challenge.streak} ngày liên tiếp` : ""}
                              {finished ? " · 🏆 Hoàn thành!" : ""}
                            </p>
                          </div>
                          <button
                            className={softButton}
                            type="button"
                            aria-label="Xóa thử thách"
                            onClick={() => {
                              const id = challenge.id;
                              setChallenges((prev) => prev.filter((item) => item.id !== id));
                              void mutate("Đã xóa thử thách", () => authRequest(`/challenges/${id}`, { method: "DELETE" }));
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                          <div className="h-full rounded-full bg-[color:var(--ui-accent)] transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <button
                          type="button"
                          className={cn("mt-3 w-full", challenge.todayChecked ? softButton : primaryButton)}
                          onClick={() => void mutate(challenge.todayChecked ? "Đã bỏ check-in hôm nay" : "Đã check-in hôm nay 🎉", () => authRequest<Challenge[]>(`/challenges/${challenge.id}/checkin`, { method: "PATCH" }), setChallenges)}
                        >
                          {challenge.todayChecked ? (
                            <>
                              <CheckCircle2 size={16} /> Đã check-in hôm nay
                            </>
                          ) : (
                            <>
                              <Flame size={16} /> Check-in hôm nay
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={Flame} title="Chưa có thử thách nào" text="Tạo một thử thách 30 ngày và check-in mỗi ngày để giữ chuỗi streak cùng nhau." />
              )}
            </div>
          ) : null}

          {mode === "settings" ? (
            <div className="grid gap-4">
              <section className={cn(panelClass, "grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]")}>
                <div className="text-center">
                  <div className="mx-auto grid h-28 w-28 place-items-center overflow-hidden rounded-[var(--ui-radius-lg)] border border-white/14 bg-white/8 text-xl font-bold">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={createMediaUrl(room.coupleAvatarUrl) ?? pickCouplePhoto(room.id)} alt={room.roomName} className="h-full w-full object-cover" />
                  </div>
                  <label className={cn(softButton, "mt-4 cursor-pointer")}>
                    <ImagePlus size={16} /> Chọn ảnh phòng
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.currentTarget.value = "";
                        if (!file) return;
                        const data = new FormData();
                        data.append("avatar", file);
                        void mutate("Đã cập nhật ảnh phòng", async () => {
                          const uploaded = await authRequest<{ avatarUrl: string }>("/uploads/couple-avatar", { method: "POST", body: data });
                          return authRequest<Room>("/room/avatar", { method: "PATCH", body: JSON.stringify({ avatarUrl: uploaded.avatarUrl }) });
                        }, setRoom);
                      }}
                    />
                  </label>
                </div>
                <InlineForm
                  title="Cài đặt không gian"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void mutate("Đã cập nhật phòng", () => authRequest<Room>("/room", { method: "PATCH", body: JSON.stringify({
                      roomName: form.roomName?.trim() ? form.roomName.trim() : room.roomName,
                      anniversaryDate: form.anniversaryDate ?? room.anniversaryDate,
                      nickname: form.nickname?.trim() ? form.nickname.trim() : room.nickname,
                      roomBio: form.roomBio?.trim() ? form.roomBio.trim() : room.roomBio
                    }) }), setRoom);
                  }}
                >
                  <input className={fieldClass} placeholder="Tên phòng" value={form.roomName ?? room.roomName ?? ""} onChange={(event) => setForm((next) => ({ ...next, roomName: event.target.value }))} />
                  <textarea className={cn(fieldClass, "min-h-24 py-3")} placeholder="Mô tả ngắn về không gian của hai bạn" value={form.roomBio ?? room.roomBio ?? ""} onChange={(event) => setForm((next) => ({ ...next, roomBio: event.target.value }))} />
                  <input className={fieldClass} type="date" value={form.anniversaryDate ?? room.anniversaryDate ?? ""} onChange={(event) => setForm((next) => ({ ...next, anniversaryDate: event.target.value }))} />
                  <input className={fieldClass} placeholder="Biệt danh của bạn trong phòng" value={form.nickname ?? room.nickname ?? ""} onChange={(event) => setForm((next) => ({ ...next, nickname: event.target.value }))} />
                  <button className={primaryButton}>Lưu thay đổi</button>
                </InlineForm>
              </section>

              <section className={panelClass}>
                <p className="ui-eyebrow">Màu nền phòng</p>
                <h3 className="ui-h2 mt-1 text-white">Tông màu vũ trụ</h3>
                <p className="ui-body mt-1 text-[color:var(--ui-text-muted)]">Đổi không gian của riêng hai đứa — cả hai người sẽ thấy cùng một tông. (Ngoài phòng vẫn giữ nguyên.)</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      { key: "violet", label: "Vũ trụ tím", swatch: "linear-gradient(135deg,#a78bfa,#ff8ac4)" },
                      { key: "ocean", label: "Vũ trụ xanh biển", swatch: "linear-gradient(135deg,#38bdf8,#22d3ee)" },
                      { key: "sunset", label: "Vũ trụ hồng hoàng hôn", swatch: "linear-gradient(135deg,#ff8a5c,#ff5ea8)" }
                    ] as const
                  ).map((option) => {
                    const active = (room.theme ?? "violet") === option.key;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (typeof document !== "undefined") {
                            document.querySelector<HTMLElement>(".cosmic-page-shell")?.setAttribute("data-room-theme", option.key);
                          }
                          void mutate(
                            "Đã đổi tông màu phòng",
                            () => authRequest<Room>("/room", { method: "PATCH", body: JSON.stringify({ theme: option.key }) }),
                            setRoom
                          );
                        }}
                        className={cn(
                          "ui-card flex items-center gap-3 text-left transition",
                          active ? "ring-2 ring-[color:var(--ui-accent)]" : "hover:bg-white/[0.06]"
                        )}
                      >
                        <span className="h-9 w-9 shrink-0 rounded-full border border-white/25" style={{ background: option.swatch }} />
                        <span className="min-w-0">
                          <span className="block text-[14px] font-bold text-white">{option.label}</span>
                          <span className="block text-[11.5px] text-[color:var(--ui-text-soft)]">{active ? "Đang dùng" : "Chọn"}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className={panelClass}>
                <h3 className="ui-h2 text-white">Kết nối</h3>
                <p className="ui-body mt-2 text-[color:var(--ui-text-muted)]">Mã mời chỉ dùng khi phòng còn một người.</p>
                {room.status === "waiting" ? (
                  <div className="ui-card mt-4">
                    <p className="ui-eyebrow">Mã mời</p>
                    <p className="mt-2 font-mono text-[26px] font-bold tracking-[0.18em] text-white">{room.inviteCode}</p>
                  </div>
                ) : (
                  <p className="ui-card ui-body mt-4 text-[color:var(--ui-text-muted)]">Phòng đã đủ hai thành viên.</p>
                )}
              </section>
            </div>
          ) : null}

        </main>

        <aside className="grid content-start gap-4">
          <div className={panelClass}>
            <p className="ui-eyebrow">Hai người trong phòng</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {room.members.map((member) => {
                const memberLabel = getMemberLabel(member);
                const avatar = resolveAvatar({ avatarUrl: member.avatarUrl, id: member.id, name: memberLabel });

                return (
                  <div key={member.id} className="ui-card">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[var(--ui-radius-sm)] bg-white/8 text-sm font-bold text-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={avatar} alt={memberLabel} className="h-full w-full object-cover" />
                        <span
                          className={cn(
                            "absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-[#0e1024]",
                            member.isOnline ? "bg-[#3ac17d]" : "bg-[#b8afba]"
                          )}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="ui-h3 truncate text-white">{memberLabel}</p>
                        <p className="ui-caption text-[color:var(--ui-text-soft)]">{member.role === "owner" ? "Bạn" : "Người ấy"}</p>
                      </div>
                    </div>
                    <p className={cn("ui-caption mt-3", member.isOnline ? "text-[#7ee7ad]" : "text-[color:var(--ui-text-muted)]")}>
                      {formatOnline(member)}
                    </p>
                  </div>
                );
              })}
              {room.memberCount < 2 ? (
                <div className="ui-card ui-body text-[color:var(--ui-text-muted)]">
                  Phòng đang chờ người còn lại dùng mã mời.
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>

      {memoryComposerOpen ? (
        <div className="only-modal-backdrop fixed inset-0 z-50 grid place-items-center p-4" onClick={() => setMemoryComposerOpen(false)}>
          <div className="only-modal-card only-pop w-full max-w-3xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="ui-eyebrow">Kỷ niệm mới</p>
                <h3 className="ui-h2 text-white">Đăng thêm một mảnh ghép</h3>
              </div>
              <button className={softButton} type="button" onClick={() => setMemoryComposerOpen(false)} aria-label="Đóng">
                <X size={16} />
              </button>
            </div>
            <form
              className="grid max-h-[calc(92vh-74px)] gap-3 overflow-y-auto p-5"
              onSubmit={(event) => {
                event.preventDefault();
                void mutate(
                  "Đã lưu kỷ niệm",
                  () => authRequest<Memory[]>("/memories", { method: "POST", body: JSON.stringify({ title: form.title, content: form.content, memoryDate: form.memoryDate, imageUrl: form.imageUrl, imageData: form.memoryImageData, placeName: form.placeName }) }),
                  setMemories,
                  () => setMemoryComposerOpen(false)
                );
              }}
            >
              <input className={fieldClass} placeholder="Tên kỷ niệm" value={form.title ?? ""} onChange={(event) => setForm((next) => ({ ...next, title: event.target.value }))} />
              <input className={fieldClass} type="date" value={form.memoryDate ?? ""} onChange={(event) => setForm((next) => ({ ...next, memoryDate: event.target.value }))} />
              <ImagePicker
                preview={form.memoryImageData ?? createMediaUrl(form.imageUrl)}
                onPick={(imageData) => setForm((next) => ({ ...next, memoryImageData: imageData, imageUrl: "" }))}
                onClear={() => setForm((next) => ({ ...next, memoryImageData: "", imageUrl: "" }))}
                title="Ảnh kỷ niệm"
              />
              <input className={fieldClass} placeholder="Hoặc dán link ảnh riêng nếu cần" value={form.imageUrl ?? ""} onChange={(event) => setForm((next) => ({ ...next, imageUrl: event.target.value, memoryImageData: "" }))} />
              <input className={fieldClass} placeholder="Địa điểm đã đi qua" value={form.placeName ?? ""} onChange={(event) => setForm((next) => ({ ...next, placeName: event.target.value }))} />
              <textarea className={cn(fieldClass, "min-h-28 py-3")} placeholder="Điều muốn ghi lại" value={form.content ?? ""} onChange={(event) => setForm((next) => ({ ...next, content: event.target.value }))} />
              <p className="ui-caption text-[color:var(--ui-text-soft)]">Kỷ niệm cần có ảnh hoặc địa điểm. Nếu chỉ là ngày quan trọng, dùng Nhắc nhở sẽ hợp hơn.</p>
              <button className={primaryButton} disabled={busy}>Lưu kỷ niệm</button>
            </form>
          </div>
        </div>
      ) : null}

      {calendarComposerOpen ? (
        <div className="only-modal-backdrop fixed inset-0 z-50 grid place-items-center p-4" onClick={() => setCalendarComposerOpen(false)}>
          <div className="only-modal-card only-pop w-full max-w-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="ui-eyebrow">Lịch hẹn</p>
                <h3 className="ui-h2 text-white">Thêm lịch hẹn mới</h3>
              </div>
              <button className={softButton} type="button" onClick={() => setCalendarComposerOpen(false)} aria-label="Đóng">
                <X size={16} />
              </button>
            </div>
            <form
              className="grid gap-3 p-5 pt-0"
              onSubmit={(event) => {
                event.preventDefault();
                void mutate(
                  "Đã thêm lịch hẹn",
                  () => authRequest<CalendarEvent[]>("/calendar-events", { method: "POST", body: JSON.stringify({ title: form.eventTitle, eventType: form.eventType || "date", startsAt: form.startsAt, description: form.eventDescription }) }),
                  setCalendarEvents,
                  () => setCalendarComposerOpen(false)
                );
              }}
            >
              <input className={fieldClass} placeholder="Nội dung, ví dụ: Cắm trại Đà Lạt" value={form.eventTitle ?? ""} onChange={(event) => setForm((next) => ({ ...next, eventTitle: event.target.value }))} />
              <select className={fieldClass} value={form.eventType ?? "date"} onChange={(event) => setForm((next) => ({ ...next, eventType: event.target.value }))}>
                {Object.entries(calendarEventMeta).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
              </select>
              <input className={fieldClass} type="datetime-local" value={form.startsAt ?? toInputDateTime(new Date())} onChange={(event) => setForm((next) => ({ ...next, startsAt: event.target.value }))} />
              <textarea className={cn(fieldClass, "min-h-28 py-3")} placeholder="Ghi chú: địa điểm, chuẩn bị gì..." value={form.eventDescription ?? ""} onChange={(event) => setForm((next) => ({ ...next, eventDescription: event.target.value }))} />
              <button className={primaryButton} disabled={busy}>Lưu lịch hẹn</button>
            </form>
          </div>
        </div>
      ) : null}

      {albumComposerOpen ? (
        <div className="only-modal-backdrop fixed inset-0 z-50 grid place-items-center p-4" onClick={() => setAlbumComposerOpen(false)}>
          <div className="only-modal-card only-pop w-full max-w-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="ui-eyebrow">Thư mục mới</p>
                <h3 className="ui-h2 text-white">Tạo thư mục ảnh</h3>
              </div>
              <button className={softButton} type="button" onClick={() => setAlbumComposerOpen(false)} aria-label="Đóng">
                <X size={16} />
              </button>
            </div>
            <form
              className="grid gap-3 p-5 pt-0"
              onSubmit={(event) => {
                event.preventDefault();
                void mutate(
                  "Đã tạo thư mục",
                  () => authRequest<CoupleAlbum[]>("/albums", { method: "POST", body: JSON.stringify({ title: form.albumTitle, description: form.albumDescription }) }),
                  setAlbums,
                  () => setAlbumComposerOpen(false)
                );
              }}
            >
              <input className={fieldClass} placeholder="Tên thư mục: Sinh nhật, Đi chơi..." value={form.albumTitle ?? ""} onChange={(event) => setForm((next) => ({ ...next, albumTitle: event.target.value }))} />
              <textarea className={cn(fieldClass, "min-h-24 py-3")} placeholder="Mô tả ngắn cho thư mục" value={form.albumDescription ?? ""} onChange={(event) => setForm((next) => ({ ...next, albumDescription: event.target.value }))} />
              <button className={primaryButton} disabled={busy}>Tạo thư mục</button>
            </form>
          </div>
        </div>
      ) : null}

      {albumPhotoComposerOpen && selectedAlbum ? (
        <div className="only-modal-backdrop fixed inset-0 z-50 grid place-items-center p-4" onClick={() => setAlbumPhotoComposerOpen(false)}>
          <div className="only-modal-card only-pop w-full max-w-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="ui-eyebrow">Thêm ảnh</p>
                <h3 className="ui-h2 truncate text-white">{selectedAlbum.title}</h3>
              </div>
              <button className={softButton} type="button" onClick={() => setAlbumPhotoComposerOpen(false)} aria-label="Đóng">
                <X size={16} />
              </button>
            </div>
            <form
              className="grid max-h-[calc(92vh-74px)] gap-3 overflow-y-auto p-5"
              onSubmit={(event) => {
                event.preventDefault();
                void mutate(
                  "Đã thêm ảnh",
                  () => authRequest<CoupleAlbum[]>(`/albums/${selectedAlbum.id}/photos`, { method: "POST", body: JSON.stringify({ imageUrl: form.imageUrl, imageData: form.albumImageData, caption: form.caption }) }),
                  setAlbums,
                  () => setAlbumPhotoComposerOpen(false)
                );
              }}
            >
              <ImagePicker
                preview={form.albumImageData ?? createMediaUrl(form.imageUrl)}
                onPick={(imageData) => setForm((next) => ({ ...next, albumImageData: imageData, imageUrl: "" }))}
                onClear={() => setForm((next) => ({ ...next, albumImageData: "", imageUrl: "" }))}
                title="Ảnh trong thư mục"
              />
              <input className={fieldClass} placeholder="Hoặc dán link ảnh riêng nếu cần" value={form.imageUrl ?? ""} onChange={(event) => setForm((next) => ({ ...next, imageUrl: event.target.value, albumImageData: "" }))} />
              <textarea className={cn(fieldClass, "min-h-24 py-3")} placeholder="Nội dung / câu chuyện của bức ảnh" value={form.caption ?? ""} onChange={(event) => setForm((next) => ({ ...next, caption: event.target.value }))} />
              <button className={primaryButton} disabled={busy}>Thêm ảnh</button>
            </form>
          </div>
        </div>
      ) : null}

      {quizComposerOpen ? (
        <div className="only-modal-backdrop fixed inset-0 z-50 grid place-items-center p-4" onClick={resetQuizComposer}>
          <div className="only-modal-card only-pop w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="ui-eyebrow">Tâm sự</p>
                <h3 className="ui-h2 text-white">Tạo trò chơi cho hai đứa</h3>
              </div>
              <button className={softButton} type="button" onClick={resetQuizComposer} aria-label="Đóng">
                <X size={16} />
              </button>
            </div>
            <div className="grid max-h-[calc(94vh-74px)] gap-5 overflow-y-auto p-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <aside className="ui-card grid content-start gap-1.5">
                {[
                  [1, "Tên & ý nghĩa"],
                  [2, "Đặt câu hỏi"],
                  [3, "Xem lại"]
                ].map(([step, label]) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setQuizStep(step as 1 | 2 | 3)}
                    className={cn(
                      "flex min-h-10 items-center gap-3 rounded-[var(--ui-radius-sm)] px-3 text-left text-[13.5px] font-semibold transition",
                      quizStep === step ? "bg-[var(--ui-accent-soft)] text-white" : "text-[color:var(--ui-text-muted)] hover:bg-white/6"
                    )}
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[11px] text-white">{step}</span>
                    {label}
                  </button>
                ))}
              </aside>

              <div className="min-w-0">
                {quizStep === 1 ? (
                  <section className="grid gap-3">
                    <div className="ui-card">
                      <h4 className="ui-h2 text-white">Trò này muốn kiểm tra điều gì?</h4>
                      <p className="ui-body mt-1 leading-6 text-[color:var(--ui-text-muted)]">
                        Tên và ý nghĩa giúp người chơi hiểu đây là trò vui, trò hiểu nhau, hay một buổi tâm sự nghiêm túc.
                      </p>
                    </div>
                    <input className={fieldClass} placeholder="Tên trò chơi: Cậu hiểu tớ tới đâu?" value={form.quizTitle ?? ""} onChange={(event) => setForm((next) => ({ ...next, quizTitle: event.target.value }))} />
                    <textarea className={cn(fieldClass, "min-h-28 py-3")} placeholder="Ý nghĩa: Những câu hỏi này giúp mình hiểu thói quen, điều thích và điều cần được quan tâm của nhau..." value={form.quizMeaning ?? ""} onChange={(event) => setForm((next) => ({ ...next, quizMeaning: event.target.value }))} />
                    <input className={fieldClass} inputMode="numeric" placeholder="Thời gian mỗi câu, ví dụ 30" value={form.quizTimeLimit ?? "30"} onChange={(event) => setForm((next) => ({ ...next, quizTimeLimit: event.target.value }))} />
                    <button className={primaryButton} type="button" onClick={() => setQuizStep(2)}>Tiếp tục đặt câu hỏi</button>
                  </section>
                ) : null}

                {quizStep === 2 ? (
                  <section className="grid gap-4">
                    <div className="ui-card">
                      <h4 className="ui-h2 text-white">Đặt câu hỏi</h4>
                      <p className="ui-body mt-1 leading-6 text-[color:var(--ui-text-muted)]">
                        Mỗi câu cần ít nhất A/B và một đáp án đúng để hệ thống chấm điểm.
                      </p>
                    </div>
                    <textarea className={cn(fieldClass, "min-h-24 py-3")} placeholder="Câu hỏi: Khi buồn tớ thường muốn cậu làm gì nhất?" value={form.draftQuestionText ?? ""} onChange={(event) => setForm((next) => ({ ...next, draftQuestionText: event.target.value }))} />
                    <div className="grid gap-2 md:grid-cols-2">
                      <input className={fieldClass} placeholder="A. Ôm một cái" value={form.draftOptionA ?? ""} onChange={(event) => setForm((next) => ({ ...next, draftOptionA: event.target.value }))} />
                      <input className={fieldClass} placeholder="B. Để yên một lúc" value={form.draftOptionB ?? ""} onChange={(event) => setForm((next) => ({ ...next, draftOptionB: event.target.value }))} />
                      <input className={fieldClass} placeholder="C. Rủ đi ăn" value={form.draftOptionC ?? ""} onChange={(event) => setForm((next) => ({ ...next, draftOptionC: event.target.value }))} />
                      <input className={fieldClass} placeholder="D. Gọi điện ngay" value={form.draftOptionD ?? ""} onChange={(event) => setForm((next) => ({ ...next, draftOptionD: event.target.value }))} />
                    </div>
                    <select className={fieldClass} value={form.draftCorrectOption ?? "A"} onChange={(event) => setForm((next) => ({ ...next, draftCorrectOption: event.target.value }))}>
                      <option value="A">Đáp án đúng: A</option>
                      <option value="B">Đáp án đúng: B</option>
                      <option value="C">Đáp án đúng: C</option>
                      <option value="D">Đáp án đúng: D</option>
                    </select>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={softButton} onClick={addDraftQuestion}>
                        <Plus size={16} /> Thêm câu này
                      </button>
                      <button type="button" className={primaryButton} onClick={() => setQuizStep(3)} disabled={!quizDraftQuestions.length}>
                        Xem lại {quizDraftQuestions.length} câu
                      </button>
                    </div>
                    <div className="grid gap-2">
                      {quizDraftQuestions.map((question, index) => (
                        <div key={question.id} className="ui-card">
                          <div className="flex items-start justify-between gap-3">
                            <p className="ui-h3 text-white">Câu {index + 1}: {question.questionText}</p>
                            <button type="button" className="text-xs font-bold text-[#ff9fbd]" onClick={() => setQuizDraftQuestions((items) => items.filter((item) => item.id !== question.id))}>Xóa</button>
                          </div>
                          <p className="ui-caption mt-1 text-[color:var(--ui-text-soft)]">Đáp án đúng: {question.correctOption}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {quizStep === 3 ? (
                  <section className="grid gap-4">
                    <div className="ui-card">
                      <h4 className="ui-h2 text-white">{form.quizTitle || "Chưa đặt tên trò chơi"}</h4>
                      <p className="ui-body mt-1 leading-6 text-[color:var(--ui-text-muted)]">{form.quizMeaning || "Chưa có ý nghĩa cho trò chơi này."}</p>
                      <p className="ui-eyebrow mt-2">{quizDraftQuestions.length} câu · {form.quizTimeLimit || 30}s/câu</p>
                    </div>
                    <div className="grid gap-2">
                      {quizDraftQuestions.map((question, index) => (
                        <div key={question.id} className="ui-card">
                          <p className="ui-h3 text-white">Câu {index + 1}: {question.questionText}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {question.options.map((option) => (
                              <span key={option.key} className={cn("rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[12px] font-semibold text-[color:var(--ui-text-muted)]", question.correctOption === option.key && "border-[#7ee7ad]/40 bg-[#7ee7ad]/12 text-[#7ee7ad]")}>
                                {option.key}. {option.text}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={softButton} onClick={() => setQuizStep(2)}>Quay lại sửa câu hỏi</button>
                      <button
                        type="button"
                        className={primaryButton}
                        disabled={busy || !quizDraftQuestions.length}
                        onClick={() =>
                          void mutate(
                            "Đã tạo trò chơi",
                            () => authRequest<QuizGame>("/quiz-games", {
                              method: "POST",
                              body: JSON.stringify({
                                title: form.quizTitle,
                                meaning: form.quizMeaning,
                                timeLimitSeconds: form.quizTimeLimit,
                                questions: quizDraftQuestions.map((question) => ({
                                  questionText: question.questionText,
                                  optionA: question.options.find((option) => option.key === "A")?.text,
                                  optionB: question.options.find((option) => option.key === "B")?.text,
                                  optionC: question.options.find((option) => option.key === "C")?.text,
                                  optionD: question.options.find((option) => option.key === "D")?.text,
                                  correctOption: question.correctOption
                                }))
                              })
                            }),
                            (game) => setQuizGames((items) => [game, ...items]),
                            resetQuizComposer
                          )
                        }
                      >
                        Tạo trò chơi
                      </button>
                    </div>
                  </section>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedPhoto ? (
        <div className="only-modal-backdrop fixed inset-0 z-50 grid place-items-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="only-modal-card only-pop max-h-[92vh] w-full max-w-5xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="ui-eyebrow">Chi tiết ảnh</p>
                <h3 className="ui-h2 text-white">{selectedPhoto.uploaderName ?? "Người ấy"} đã đăng</h3>
              </div>
              <button className={softButton} onClick={() => setSelectedPhoto(null)}>Đóng</button>
            </div>
            <div className="grid max-h-[calc(92vh-73px)] overflow-y-auto lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="grid min-h-[360px] place-items-center bg-[var(--ui-bg-deep)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={createMediaUrl(selectedPhoto.imageUrl) ?? selectedPhoto.imageUrl} alt={selectedPhoto.caption ?? "Ảnh trong album"} className="max-h-[72vh] w-full object-contain" />
              </div>
              <div className="border-t border-white/10 p-5 lg:border-l lg:border-t-0">
                <p className="ui-eyebrow">Ngày đăng</p>
                <p className="ui-h3 mt-1 text-white">{formatDate(selectedPhoto.createdAt)}</p>
                <p className="ui-eyebrow mt-5">Nội dung hình ảnh</p>
                <p className="ui-card ui-body mt-2 whitespace-pre-wrap leading-6 text-[color:var(--ui-text-muted)]">
                  {selectedPhoto.caption ?? "Chưa có nội dung cho ảnh này."}
                </p>
                <button
                  className={cn(softButton, "mt-5 border-[#ff9fbd]/40 text-[color:var(--ui-accent)]")}
                  onClick={() => {
                    const photoId = selectedPhoto.id;
                    setSelectedPhoto(null);
                    void mutate("Đã xóa ảnh", () => authRequest(`/albums/photos/${photoId}`, { method: "DELETE" }));
                  }}
                >
                  <Trash2 size={15} /> Xóa ảnh
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {openMemory ? (
        <div className="only-modal-backdrop fixed inset-0 z-50 grid place-items-center p-4" onClick={() => setOpenMemory(null)}>
          <div className="only-modal-card only-pop relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden" onClick={(event) => event.stopPropagation()}>
            {/* HERO: ảnh phủ tiêu đề, gradient tan dần thay đường kẻ header cứng */}
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={openMemory.imageUrl ? createMediaUrl(openMemory.imageUrl) ?? openMemory.imageUrl : pickCouplePhoto(openMemory.id)}
                alt={openMemory.title}
                className="h-56 w-full rounded-b-[var(--ui-radius-lg)] object-cover sm:h-64"
              />
              <div className="pointer-events-none absolute inset-0 rounded-b-[var(--ui-radius-lg)] bg-gradient-to-t from-[#070817]/85 via-[#070817]/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 sm:p-6">
                <div className="min-w-0">
                  <p className="ui-eyebrow text-[color:var(--ui-accent)]">Kỷ niệm</p>
                  <h3 className="ui-h2 truncate text-white drop-shadow-[0_1px_8px_rgba(7,8,23,0.6)]">{openMemory.title}</h3>
                  <p className="ui-caption mt-1 inline-flex items-center gap-1.5 text-white/85">
                    <CalendarDays size={13} /> {formatDate(openMemory.memoryDate)}
                  </p>
                </div>
              </div>
              <button
                className={cn(softButton, "absolute right-4 top-4 grid h-10 w-10 shrink-0 place-items-center rounded-full p-0 backdrop-blur-md")}
                type="button"
                onClick={() => setOpenMemory(null)}
                aria-label="Đóng kỷ niệm"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-5 overflow-y-auto px-6 pb-6 pt-5">
              {openMemory.content ? (
                <p className="ui-body whitespace-pre-wrap leading-7 text-[color:var(--ui-text-muted)]">{openMemory.content}</p>
              ) : null}

              {openMemory.placeName ? (
                <div className="rounded-[var(--ui-radius-lg)] bg-[color:var(--ui-bg-card)] px-4 py-3 ring-1 ring-white/5">
                  <span className="ui-caption block text-[color:var(--ui-text-soft)]">Địa điểm</span>
                  <span className="ui-body block truncate font-semibold text-white">{openMemory.placeName}</span>
                </div>
              ) : null}

              <hr className="ui-divider opacity-50" />

              <button
                className={cn(softButton, "w-fit justify-self-start gap-2 border-[#ff9fbd]/40 text-[color:var(--ui-accent)]")}
                type="button"
                onClick={() => {
                  const memoryId = openMemory.id;
                  setOpenMemory(null);
                  void mutate("Đã xóa", () => authRequest(`/memories/${memoryId}`, { method: "DELETE" }));
                }}
              >
                <Trash2 size={15} /> Xóa kỷ niệm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
