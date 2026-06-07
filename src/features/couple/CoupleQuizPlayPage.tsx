"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, Clock3, HeartHandshake, Loader2, PartyPopper, Play, RotateCcw, Trophy, X } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { authRequest } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { useAuth } from "@/providers/AuthProvider";

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

function getParamId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  return `${Math.floor(safe / 60)}:${(safe % 60).toString().padStart(2, "0")}`;
}

function getScoreMessage(score: number, total: number) {
  if (!total) return "Chưa có dữ liệu.";
  const ratio = score / total;
  if (ratio >= 0.9) return "Hiểu nhau quá trời luôn! 💞";
  if (ratio >= 0.65) return "Khá hiểu nhau rồi đó 💕";
  if (ratio >= 0.4) return "Còn vài điều để khám phá nhau 💫";
  return "Cùng tâm sự thêm chút nha 🌙";
}

export function CoupleQuizPlayPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = getParamId(params.id);
  const searchParams = useSearchParams();
  const viaWeb = searchParams.get("via") === "web";
  const { isGuest, openAuth, status, user } = useAuth();
  const { notify } = useToast();
  const [game, setGame] = useState<QuizGame | null>(null);
  const [report, setReport] = useState<QuizGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remaining, setRemaining] = useState(30);
  const [answers, setAnswers] = useState<Record<string, QuizOptionKey>>({});
  const [accepted, setAccepted] = useState(viaWeb);
  const startedAtRef = useRef<number | null>(null);

  const questions = game?.questions ?? [];
  const currentQuestion = questions[currentIndex] ?? null;
  const selectedOption = currentQuestion ? answers[currentQuestion.id] : undefined;
  const latestAttempt = report?.attempts.find((attempt) => attempt.userId === user?.id) ?? report?.attempts[0] ?? null;
  const progressPercent = questions.length ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;
  const timerPercent = game ? Math.max(0, Math.min(100, (remaining / game.timeLimitSeconds) * 100)) : 0;
  const lowTime = remaining <= 5;

  const submitAttempt = useCallback(async () => {
    if (!game || submitting || completed) {
      return;
    }

    setSubmitting(true);
    try {
      const durationSeconds = startedAtRef.current ? Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)) : 0;
      const result = await authRequest<QuizGame>(`/quiz-games/${game.id}/attempts`, {
        method: "POST",
        body: JSON.stringify({
          durationSeconds,
          answers: Object.entries(answers).map(([questionId, selectedOptionValue]) => ({
            questionId,
            selectedOption: selectedOptionValue
          }))
        })
      });

      setReport(result);
      setCompleted(true);
      notify({ tone: "success", title: "Đã nộp bài 🎉" });
    } catch (error) {
      notify({ tone: "error", title: "Chưa nộp được bài", message: error instanceof Error ? error.message : "Thử lại sau nhé." });
    } finally {
      setSubmitting(false);
    }
  }, [answers, completed, game, notify, submitting]);

  const goNext = useCallback(() => {
    if (!game) {
      return;
    }

    if (currentIndex >= game.questions.length - 1) {
      void submitAttempt();
      return;
    }

    setCurrentIndex((index) => index + 1);
    setRemaining(game.timeLimitSeconds);
  }, [currentIndex, game, submitAttempt]);

  useEffect(() => {
    if (status === "checking") {
      return;
    }

    if (isGuest || !gameId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- guest/không có gameId thì dừng loading ngay (cố ý)
      setLoading(false);
      return;
    }

    setLoading(true);
    authRequest<QuizGame>(`/quiz-games/${gameId}/play`)
      .then((data) => {
        setGame(data);
        setRemaining(data.timeLimitSeconds);
      })
      .catch((error) => {
        notify({ tone: "error", title: "Không mở được trò chơi", message: error instanceof Error ? error.message : "Trò chơi không còn tồn tại." });
      })
      .finally(() => setLoading(false));
  }, [gameId, isGuest, notify, status]);

  useEffect(() => {
    if (!started || completed || !game || submitting) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          window.setTimeout(goNext, 0);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [completed, currentIndex, game, goNext, started, submitting]);

  function startGame() {
    if (!game?.questions.length) {
      notify({ tone: "error", title: "Trò chơi chưa có câu hỏi" });
      return;
    }

    setAnswers({});
    setReport(null);
    setCompleted(false);
    setCurrentIndex(0);
    setRemaining(game.timeLimitSeconds);
    startedAtRef.current = Date.now();
    setStarted(true);
  }

  function restartGame() {
    setStarted(false);
    setCompleted(false);
    setReport(null);
    setAnswers({});
    setCurrentIndex(0);
    setRemaining(game?.timeLimitSeconds ?? 30);
    startedAtRef.current = null;
  }

  if (loading || status === "checking") {
    return (
      <main className="cosmic-page-shell grid min-h-[100dvh] place-items-center p-6 text-white">
        <div className="ui-card inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-extrabold">
          <Loader2 className="animate-spin text-[color:var(--ui-accent)]" size={18} />
          Đang mở trò chơi...
        </div>
      </main>
    );
  }

  if (isGuest || !game) {
    return (
      <main className="cosmic-page-shell grid min-h-[100dvh] place-items-center p-6 text-white">
        <section className="ui-section w-full max-w-md text-center">
          <h1 className="text-xl font-black text-white">{isGuest ? "Cần đăng nhập để chơi" : "Không tìm thấy trò chơi"}</h1>
          <p className="ui-body mt-2 text-[color:var(--ui-text-muted)]">
            {isGuest ? "Quiz chỉ mở cho hai người trong phòng riêng." : "Trò chơi có thể đã bị xóa."}
          </p>
          <button type="button" className="only-button-primary mt-5" onClick={isGuest ? openAuth : () => router.push("/questions")}>
            {isGuest ? "Đăng nhập" : "Về Tâm sự"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="cosmic-page-shell min-h-[100dvh] text-white">
      <div className="mx-auto grid min-h-[100dvh] w-full max-w-2xl gap-4 px-4 py-6 sm:px-6 lg:content-center">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/10 px-3 text-[13px] font-bold text-white/80 transition hover:bg-white/8"
            onClick={() => router.push("/questions")}
          >
            <ArrowLeft size={16} /> Tâm sự
          </button>
          <p className="ui-eyebrow truncate text-center">Quiz đôi mình</p>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/70 transition hover:bg-white/8"
            onClick={() => router.push("/questions")}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Màn chấp nhận lời mời (chỉ khi vào bằng link) */}
        {!accepted ? (
          <section className="ui-section text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--ui-accent-soft)] text-[color:var(--ui-accent)]">
              <HeartHandshake size={26} />
            </span>
            <p className="ui-eyebrow mt-4">Lời mời chơi</p>
            <h1 className="mt-1 text-2xl font-black text-white">{game.title}</h1>
            <p className="ui-body mt-2 text-[color:var(--ui-text-muted)]">{game.creator.name} mời bạn chơi một quiz nhỏ 💌</p>
            <button type="button" className="only-button-primary mx-auto mt-5 w-full max-w-xs" onClick={() => setAccepted(true)}>
              <HeartHandshake size={18} /> Chấp nhận & vào chơi
            </button>
          </section>
        ) : null}

        {/* Màn giới thiệu */}
        {accepted && !started ? (
          <section className="ui-section text-center">
            <span className="ui-pill mx-auto">
              {game.questions.length} câu · {game.timeLimitSeconds}s/câu
            </span>
            <h1 className="mt-4 text-3xl font-black leading-tight text-white">{game.title}</h1>
            {game.meaning ? <p className="ui-body mx-auto mt-2 max-w-md text-[color:var(--ui-text-muted)]">{game.meaning}</p> : null}
            <p className="ui-caption mt-3 text-[color:var(--ui-text-soft)]">Người tạo: {game.creator.name}</p>
            <button type="button" className="only-button-primary mx-auto mt-6 w-full max-w-xs" onClick={startGame}>
              <Play size={18} /> Bắt đầu chơi
            </button>
          </section>
        ) : null}

        {/* Màn chơi */}
        {accepted && started && !completed && currentQuestion ? (
          <section className="ui-section">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-extrabold text-[color:var(--ui-accent)]">Câu {currentIndex + 1}/{questions.length}</span>
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-black", lowTime ? "bg-rose-500/20 text-rose-200" : "bg-white/8 text-white")}>
                <Clock3 size={15} /> {formatDuration(remaining)}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-[color:var(--ui-accent)] transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5">
              <div className={cn("h-full rounded-full transition-all duration-1000", lowTime ? "bg-rose-400" : "bg-[#7dd3fc]")} style={{ width: `${timerPercent}%` }} />
            </div>

            <h2 className="mt-5 text-2xl font-black leading-snug text-white">{currentQuestion.questionText}</h2>

            <div className="mt-5 grid gap-2.5">
              {currentQuestion.options.map((option) => {
                const active = selectedOption === option.key;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setAnswers((items) => ({ ...items, [currentQuestion.id]: option.key }))}
                    className={cn(
                      "flex min-h-14 items-center gap-3 rounded-2xl border p-3 text-left transition",
                      active
                        ? "border-[color:var(--ui-accent)] bg-[var(--ui-accent-soft)]"
                        : "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]"
                    )}
                  >
                    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-black", active ? "bg-[color:var(--ui-accent)] text-[#1a0a16]" : "bg-white/10 text-white")}>
                      {option.key}
                    </span>
                    <span className="min-w-0 flex-1 text-[15px] font-semibold text-white">{option.text}</span>
                    {active ? <Check size={18} className="shrink-0 text-[color:var(--ui-accent)]" /> : null}
                  </button>
                );
              })}
            </div>

            <button type="button" className="only-button-primary mt-5 w-full" disabled={submitting} onClick={goNext}>
              {submitting ? <Loader2 className="animate-spin" size={17} /> : currentIndex >= questions.length - 1 ? <Trophy size={17} /> : <ChevronRight size={17} />}
              {currentIndex >= questions.length - 1 ? "Nộp bài" : "Câu tiếp theo"}
            </button>
          </section>
        ) : null}

        {/* Kết quả */}
        {accepted && completed && latestAttempt && report ? (
          <section className="grid gap-4">
            <div className="ui-section text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--ui-accent-soft)] text-[color:var(--ui-accent)]">
                <PartyPopper size={26} />
              </span>
              <h2 className="mt-4 text-4xl font-black text-white">
                {latestAttempt.score}<span className="text-[color:var(--ui-text-soft)]">/{latestAttempt.totalQuestions}</span>
              </h2>
              <p className="ui-body mt-1 text-[color:var(--ui-text-muted)]">{getScoreMessage(latestAttempt.score, latestAttempt.totalQuestions)}</p>
              <span className="ui-pill mx-auto mt-3"><Clock3 size={12} /> {formatDuration(latestAttempt.durationSeconds)}</span>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button type="button" className="only-button-primary" onClick={restartGame}>
                  <RotateCcw size={16} /> Chơi lại
                </button>
                <button type="button" className="only-button-secondary" onClick={() => router.push("/questions")}>
                  Về Tâm sự
                </button>
              </div>
            </div>

            <div className="ui-section">
              <div className="flex items-center justify-between">
                <h3 className="ui-h3 text-white">Xem lại</h3>
                <span className="ui-caption text-[color:var(--ui-text-soft)]">🟢 đáp án · ◌ cậu chọn</span>
              </div>
              <div className="mt-3 grid gap-2.5">
                {report.questions.map((question, index) => {
                  const selected = answers[question.id];

                  return (
                    <div key={question.id} className="ui-card">
                      <p className="text-[14px] font-bold text-white">
                        <span className="text-[color:var(--ui-accent)]">{index + 1}.</span> {question.questionText}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {question.options.map((option) => {
                          const isCorrect = question.correctOption === option.key;
                          const isChosen = selected === option.key;

                          return (
                            <span
                              key={option.key}
                              className={cn(
                                "rounded-full px-2.5 py-1 text-[11.5px] font-bold",
                                isCorrect
                                  ? "bg-emerald-400/15 text-emerald-300"
                                  : isChosen
                                    ? "bg-white/10 text-white ring-1 ring-[color:var(--ui-accent)]"
                                    : "bg-white/5 text-[color:var(--ui-text-soft)]"
                              )}
                            >
                              {isCorrect ? "🟢 " : isChosen ? "◌ " : ""}
                              {option.text}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
