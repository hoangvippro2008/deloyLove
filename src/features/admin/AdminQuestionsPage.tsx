"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Power, Search, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { CosmicModal } from "@/components/ui/CosmicModal";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/ToastProvider";
import {
  adminCreateQuestion,
  adminDeleteQuestion,
  adminListQuestions,
  adminSetQuestionActive,
  adminUpdateQuestion,
  type AdminQuestion
} from "@/lib/admin-client";
import { AdminPageHeader, AdminPagination } from "@/features/admin/components/AdminUI";

const PAGE_SIZE = 20;

export function AdminQuestionsPage() {
  const { notify } = useToast();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AdminQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<AdminQuestion | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formQuestion, setFormQuestion] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminQuestion | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminListQuestions({ q, page });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được câu hỏi");
    } finally {
      setLoading(false);
    }
  }, [q, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải lại khi bộ lọc đổi
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setFormQuestion("");
    setFormCategory("");
    setFormOpen(true);
  };

  const openEdit = (question: AdminQuestion) => {
    setEditing(question);
    setFormQuestion(question.question);
    setFormCategory(question.category ?? "");
    setFormOpen(true);
  };

  const submitForm = async () => {
    setBusy(true);
    try {
      const payload = { question: formQuestion.trim(), category: formCategory.trim() || undefined };
      if (editing) {
        await adminUpdateQuestion(editing.id, payload);
        notify({ title: "Đã cập nhật câu hỏi", tone: "success" });
      } else {
        await adminCreateQuestion(payload);
        notify({ title: "Đã thêm câu hỏi", tone: "success" });
      }
      setFormOpen(false);
      void load();
    } catch (err) {
      notify({ title: "Không thành công", message: err instanceof Error ? err.message : "Có lỗi xảy ra", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (question: AdminQuestion) => {
    try {
      await adminSetQuestionActive(question.id, !question.isActive);
      void load();
    } catch (err) {
      notify({ title: "Không thành công", message: err instanceof Error ? err.message : "Có lỗi xảy ra", tone: "error" });
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await adminDeleteQuestion(pendingDelete.id);
      notify({ title: "Đã xoá câu hỏi", tone: "success" });
      setPendingDelete(null);
      void load();
    } catch (err) {
      notify({ title: "Không thành công", message: err instanceof Error ? err.message : "Có lỗi xảy ra", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Câu hỏi hằng ngày"
        description="Ngân hàng câu hỏi gợi ý cho các cặp đôi."
        actions={
          <ActionButton icon={<Plus size={15} />} onClick={openCreate}>
            Thêm câu hỏi
          </ActionButton>
        }
      />

      <GlassPanel className="p-4 sm:p-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setQ(search.trim());
          }}
          className="max-w-md"
        >
          <TextField
            label="Tìm kiếm"
            leftIcon={<Search size={15} />}
            placeholder="Nội dung câu hỏi…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </form>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center gap-3 py-8 text-sm font-extrabold text-cosmic-mist">
              <Loader2 size={18} className="animate-spin text-cosmic-rose" aria-hidden="true" /> Đang tải…
            </div>
          ) : error ? (
            <p className="py-8 text-sm font-semibold text-[#ffd7e4]">{error}</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-sm font-semibold text-cosmic-mist">Chưa có câu hỏi nào.</p>
          ) : (
            <ul className="grid gap-2">
              {items.map((question) => (
                <li
                  key={question.id}
                  className="flex items-start justify-between gap-3 rounded-[12px] border border-white/8 bg-white/[0.03] p-3"
                >
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-white">{question.question}</p>
                    <p className="mt-0.5 text-[12px] font-medium text-[color:var(--ui-text-soft)]">
                      {question.category ? `${question.category} · ` : ""}
                      {question.isActive ? "Đang bật" : "Đã tắt"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleActive(question)}
                      title={question.isActive ? "Tắt" : "Bật"}
                      className={cnBtn(question.isActive)}
                    >
                      <Power size={14} />
                    </button>
                    <button type="button" onClick={() => openEdit(question)} title="Sửa" className={cnBtn(false)}>
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(question)}
                      title="Xoá"
                      className="grid h-9 w-9 place-items-center rounded-[10px] border border-white/10 text-[color:var(--ui-accent)] transition hover:bg-white/6"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!loading && !error && total > 0 ? (
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        ) : null}
      </GlassPanel>

      <CosmicModal open={formOpen} onClose={() => (busy ? undefined : setFormOpen(false))} title={editing ? "Sửa câu hỏi" : "Thêm câu hỏi"}>
        <div className="grid gap-3">
          <label className="text-[13px] font-semibold text-cosmic-mist">
            Nội dung câu hỏi
            <textarea
              value={formQuestion}
              onChange={(event) => setFormQuestion(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-[10px] border border-white/12 bg-white/5 px-3 py-2 text-[14px] font-semibold text-white"
              placeholder="Ví dụ: Hôm nay điều gì làm cậu vui?"
            />
          </label>
          <TextField
            label="Danh mục (tuỳ chọn)"
            value={formCategory}
            onChange={(event) => setFormCategory(event.target.value)}
            placeholder="warm, date, memory…"
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <ActionButton variant="ghost" onClick={() => setFormOpen(false)} disabled={busy}>
            Huỷ
          </ActionButton>
          <ActionButton onClick={submitForm} disabled={busy} icon={busy ? <Loader2 size={15} className="animate-spin" /> : undefined}>
            {editing ? "Lưu" : "Thêm"}
          </ActionButton>
        </div>
      </CosmicModal>

      <CosmicModal open={pendingDelete !== null} onClose={() => (busy ? undefined : setPendingDelete(null))} title="Xoá câu hỏi">
        <p className="text-sm font-semibold text-cosmic-mist">Xoá câu hỏi này khỏi ngân hàng?</p>
        <div className="mt-5 flex justify-end gap-2">
          <ActionButton variant="ghost" onClick={() => setPendingDelete(null)} disabled={busy}>
            Huỷ
          </ActionButton>
          <ActionButton onClick={confirmDelete} disabled={busy} icon={busy ? <Loader2 size={15} className="animate-spin" /> : undefined}>
            Xoá
          </ActionButton>
        </div>
      </CosmicModal>
    </div>
  );
}

function cnBtn(active: boolean) {
  return `grid h-9 w-9 place-items-center rounded-[10px] border border-white/10 transition hover:bg-white/6 ${
    active ? "text-[#a7f3d0]" : "text-white"
  }`;
}
