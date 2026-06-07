"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info";

type ToastInput = {
  action?: {
    label: string;
    onClick: () => void;
  };
  title: string;
  message?: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastItem = {
  action?: ToastInput["action"];
  id: number;
  message: string;
  title: string;
  tone: ToastTone;
};

type ToastContextValue = {
  notify: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, { icon: ReactNode; className: string; titleClassName: string }> = {
  error: {
    icon: <AlertCircle size={18} aria-hidden="true" />,
    className: "border-[#f4a3bd]/24 bg-[#1a1025]/88 text-[#ffd7e4]",
    titleClassName: "text-[#fff4f8]"
  },
  info: {
    icon: <Info size={18} aria-hidden="true" />,
    className: "border-[#93c5fd]/22 bg-[#101833]/88 text-[#dbeafe]",
    titleClassName: "text-[#f8fbff]"
  },
  success: {
    icon: <CheckCircle2 size={18} aria-hidden="true" />,
    className: "border-[#a7f3d0]/20 bg-[#10261f]/88 text-[#d7f9e9]",
    titleClassName: "text-[#f7fffb]"
  }
};

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    ({ action, title, message = "", tone = "info", durationMs = 4500 }: ToastInput) => {
      const id = nextId.current;
      nextId.current += 1;

      setToasts((current) => [
        ...current.slice(-2),
        {
          id,
          action,
          message,
          title,
          tone
        }
      ]);

      window.setTimeout(() => removeToast(id), durationMs);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions removals"
        className="fixed right-4 top-4 z-[70] grid w-[calc(100vw-2rem)] max-w-sm gap-3 sm:right-6 sm:top-6"
      >
        {toasts.map((toast) => {
          const styles = toneStyles[toast.tone];

          return (
            <div
              key={toast.id}
              role={toast.tone === "error" ? "alert" : "status"}
              className={cn(
                "only-pop rounded-[14px] border px-4 py-3 shadow-[0_18px_50px_rgba(3,6,18,0.35)] backdrop-blur-xl",
                styles.className
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{styles.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-semibold", styles.titleClassName)}>
                    {toast.title}
                  </p>
                  {toast.message ? (
                    <p className="mt-1 text-sm leading-5 opacity-[0.86]">{toast.message}</p>
                  ) : null}
                  {toast.action ? (
                    <button
                      type="button"
                      onClick={() => {
                        toast.action?.onClick();
                        removeToast(toast.id);
                      }}
                      className="mt-3 min-h-8 rounded-full border border-white/15 bg-white/10 px-3 text-xs font-extrabold text-white transition hover:bg-white/16"
                    >
                      {toast.action.label}
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label="Đóng thông báo"
                  onClick={() => removeToast(toast.id)}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-current/70 transition hover:bg-white/12 hover:text-current"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}
