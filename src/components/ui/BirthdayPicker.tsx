"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

// Bộ chọn ngày sinh kiểu cuộn theo ngày, tháng, năm.
const ITEM_H = 36; // chiều cao mỗi dòng (px)

const pad2 = (n: number) => String(n).padStart(2, "0");
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const daysInMonth = (year: number, month: number) =>
  [31, isLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 31;

type Item = { label: string; value: number };

function WheelColumn({
  items,
  value,
  onChange,
  ariaLabel
}: {
  items: Item[];
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const timer = useRef<number | null>(null);
  const found = items.findIndex((item) => item.value === value);
  const index = found < 0 ? 0 : found;

  // Canh vị trí cuộn theo value khi đổi từ bên ngoài (vd đổi tháng làm số ngày thay đổi)
  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const target = index * ITEM_H;
    if (Math.abs(el.scrollTop - target) > 2) {
      el.scrollTop = target;
    }
  }, [index]);

  useEffect(() => () => {
    if (timer.current) {
      window.clearTimeout(timer.current);
    }
  }, []);

  function handleScroll() {
    const el = ref.current;
    if (!el) {
      return;
    }
    if (timer.current) {
      window.clearTimeout(timer.current);
    }
    // chốt giá trị sau khi ngừng cuộn (scroll-snap đã canh giữa)
    timer.current = window.setTimeout(() => {
      const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM_H)));
      const next = items[i]?.value;
      if (next !== undefined && next !== value) {
        onChange(next);
      }
    }, 90);
  }

  return (
    <div className="relative flex-1">
      <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-[color:var(--ui-text-soft)]">{ariaLabel}</p>
      <div className="relative">
        <div
          ref={ref}
          onScroll={handleScroll}
          role="listbox"
          aria-label={ariaLabel}
          className="scrollbar-none overflow-y-auto"
          style={{ height: ITEM_H * 3, paddingBlock: ITEM_H, scrollSnapType: "y mandatory", overscrollBehavior: "contain", touchAction: "pan-y" }}
        >
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              role="option"
              aria-selected={item.value === value}
              onClick={() => onChange(item.value)}
              className={cn(
                "grid w-full place-items-center text-[14px] tabular-nums transition",
                item.value === value ? "font-bold text-white" : "text-[color:var(--ui-text-soft)] hover:text-[color:var(--ui-text-muted)]"
              )}
              style={{ height: ITEM_H, scrollSnapAlign: "center" }}
            >
              {item.label}
            </button>
          ))}
        </div>
        {/* dải chọn ở giữa */}
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-md border-y border-[color:var(--ui-accent)]/40 bg-[var(--ui-accent-soft)]"
          style={{ height: ITEM_H }}
        />
      </div>
    </div>
  );
}

function parseValue(value: string, fallbackYear: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (match) {
    return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  }
  return { year: fallbackYear, month: 1, day: 1 };
}

export function BirthdayPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [currentYear] = useState(() => new Date().getFullYear());
  const { year, month, day } = parseValue(value, currentYear - 20);

  const maxDay = daysInMonth(year, month);
  const dayShown = Math.min(day, maxDay);

  const emit = (y: number, m: number, d: number) => {
    const clampedDay = Math.min(d, daysInMonth(y, m));
    onChange(`${y}-${pad2(m)}-${pad2(clampedDay)}`);
  };

  const dayItems: Item[] = Array.from({ length: maxDay }, (_, i) => ({ label: pad2(i + 1), value: i + 1 }));
  const monthItems: Item[] = Array.from({ length: 12 }, (_, i) => ({ label: `Th ${i + 1}`, value: i + 1 }));
  const minYear = currentYear - 100;
  const yearItems: Item[] = Array.from({ length: currentYear - minYear + 1 }, (_, i) => ({
    label: String(minYear + i),
    value: minYear + i
  }));

  return (
    <div className="flex gap-2 rounded-[10px] border border-white/10 bg-[var(--ui-bg-deep)] p-2.5">
      <WheelColumn items={dayItems} value={dayShown} onChange={(d) => emit(year, month, d)} ariaLabel="Ngày" />
      <WheelColumn items={monthItems} value={month} onChange={(m) => emit(year, m, dayShown)} ariaLabel="Tháng" />
      <WheelColumn items={yearItems} value={year} onChange={(y) => emit(y, month, dayShown)} ariaLabel="Năm" />
    </div>
  );
}
