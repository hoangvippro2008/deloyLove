import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { AdminUserRole, AdminUserStatus } from "@/lib/admin-client";

export function AdminPageHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-black text-white sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-sm font-semibold text-cosmic-mist">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

const statusStyles: Record<AdminUserStatus, string> = {
  ACTIVE: "border-[#a7f3d0]/25 bg-[#10261f]/70 text-[#d7f9e9]",
  BLOCKED: "border-[#fcd34d]/25 bg-[#291f10]/70 text-[#fde9b8]",
  DELETED: "border-[#f4a3bd]/25 bg-[#1a1025]/70 text-[#ffd7e4]"
};

const statusLabels: Record<AdminUserStatus, string> = {
  ACTIVE: "Hoạt động",
  BLOCKED: "Đã khoá",
  DELETED: "Đã xoá"
};

export function StatusBadge({ status }: { status: AdminUserStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold",
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

export function RoleBadge({ role }: { role: AdminUserRole }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold",
        role === "ADMIN"
          ? "border-[#c4b5fd]/30 bg-[#1a1633]/70 text-[#e5deff]"
          : "border-white/12 bg-white/5 text-[color:var(--ui-text-soft)]"
      )}
    >
      {role === "ADMIN" ? "Quản trị" : "Người dùng"}
    </span>
  );
}

export function AdminPagination({
  page,
  pageSize,
  total,
  onPageChange
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-[12.5px] font-semibold text-[color:var(--ui-text-soft)]">
        {from}–{to} trên {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-9 rounded-[10px] border border-white/10 px-3 text-[12.5px] font-semibold text-white transition hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Trước
        </button>
        <span className="text-[12.5px] font-semibold text-cosmic-mist">
          {page}/{totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-9 rounded-[10px] border border-white/10 px-3 text-[12.5px] font-semibold text-white transition hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau
        </button>
      </div>
    </div>
  );
}
