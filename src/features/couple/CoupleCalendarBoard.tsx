"use client";

import { useEffect, useMemo, useState } from "react";
import { ScheduleXCalendar, useNextCalendarApp } from "@schedule-x/react";
import { createViewMonthGrid } from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import "@schedule-x/theme-default/dist/index.css";

export type CoupleCalendarBoardEvent = {
  id: string;
  title: string;
  start: string;
  end?: string | null;
  calendarId?: string;
  description?: string | null;
  location?: string | null;
};

type Props = {
  events: CoupleCalendarBoardEvent[];
  onEventClick?: (eventId: string) => void;
  onSlotClick?: (isoDateTime: string) => void;
};

type ScheduleXClickEvent = {
  id?: string | number;
};

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function toScheduleString(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function toScheduleEnd(start: string, end?: string | null) {
  const fallback = new Date(new Date(start).getTime() + 60 * 60 * 1000);
  return toScheduleString(end ?? fallback);
}

const calendars = {
  date: {
    colorName: "date",
    lightColors: { main: "#ff5ea8", container: "#ffe4ef", onContainer: "#5b1d3d" },
    darkColors: { main: "#ffb3d4", onContainer: "#ffe4ef", container: "#5b1d3d" }
  },
  travel: {
    colorName: "travel",
    lightColors: { main: "#67e8f9", container: "#defcff", onContainer: "#08384a" },
    darkColors: { main: "#9bf0fb", onContainer: "#defcff", container: "#08384a" }
  },
  birthday: {
    colorName: "birthday",
    lightColors: { main: "#facc15", container: "#fff7d6", onContainer: "#4a3508" },
    darkColors: { main: "#fde58a", onContainer: "#fff7d6", container: "#4a3508" }
  },
  anniversary: {
    colorName: "anniversary",
    lightColors: { main: "#c084fc", container: "#f1e3ff", onContainer: "#3a1d65" },
    darkColors: { main: "#dcc1ff", onContainer: "#f1e3ff", container: "#3a1d65" }
  },
  movie: {
    colorName: "movie",
    lightColors: { main: "#fb923c", container: "#ffe7d2", onContainer: "#562809" },
    darkColors: { main: "#ffc28a", onContainer: "#ffe7d2", container: "#562809" }
  },
  dinner: {
    colorName: "dinner",
    lightColors: { main: "#f87171", container: "#ffe2e2", onContainer: "#5e1313" },
    darkColors: { main: "#ffb1b1", onContainer: "#ffe2e2", container: "#5e1313" }
  },
  picnic: {
    colorName: "picnic",
    lightColors: { main: "#86efac", container: "#defce9", onContainer: "#0f3a1f" },
    darkColors: { main: "#bdf5cb", onContainer: "#defce9", container: "#0f3a1f" }
  },
  camping: {
    colorName: "camping",
    lightColors: { main: "#a3e635", container: "#ecfccb", onContainer: "#2a3d0d" },
    darkColors: { main: "#cdf08a", onContainer: "#ecfccb", container: "#2a3d0d" }
  },
  other: {
    colorName: "other",
    lightColors: { main: "#a78bfa", container: "#ece4ff", onContainer: "#2c1c5b" },
    darkColors: { main: "#cdbfff", onContainer: "#ece4ff", container: "#2c1c5b" }
  }
};

export function CoupleCalendarBoard({ events, onEventClick, onSlotClick }: Props) {
  const eventsService = useMemo(() => createEventsServicePlugin(), []);

  const initialEvents = useMemo(
    () =>
      events.map((event) => ({
        id: event.id,
        title: event.title,
        start: toScheduleString(event.start),
        end: toScheduleEnd(event.start, event.end ?? null),
        calendarId: event.calendarId ?? "other",
        description: event.description ?? "",
        location: event.location ?? ""
      })),
    [events]
  );

  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- cờ mount cho schedule-x (tránh lệch SSR), set 1 lần
  useEffect(() => setMounted(true), []);

  const calendar = useNextCalendarApp({
    locale: "vi-VN",
    firstDayOfWeek: 1,
    defaultView: "month-grid",
    views: [createViewMonthGrid()],
    events: initialEvents,
    calendars,
    isDark: true,
    plugins: [eventsService],
    callbacks: {
      onEventClick: (event: ScheduleXClickEvent) => {
        if (event?.id) onEventClick?.(String(event.id));
      },
      onClickDate: (date: string) => {
        if (date) onSlotClick?.(`${date}T19:00`);
      }
    }
  });

  useEffect(() => {
    eventsService.set(initialEvents);
  }, [eventsService, initialEvents]);

  if (!mounted || !calendar) {
    return (
      <div className="rounded-[14px] border border-white/10 bg-white/5 p-6 text-sm font-semibold text-[color:var(--ui-text-muted)]">
        Đang dựng lịch...
      </div>
    );
  }

  return (
    <div className="couple-calendar-shell rounded-[14px] border border-white/10 bg-white/4 p-2 shadow-[0_18px_44px_rgba(7,8,23,0.3)]">
      <ScheduleXCalendar calendarApp={calendar} />
    </div>
  );
}
