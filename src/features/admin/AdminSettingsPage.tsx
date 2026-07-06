"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Save } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/ToastProvider";
import { adminGetSettings, adminSetSetting, type AdminSetting } from "@/lib/admin-client";
import { AdminPageHeader } from "@/features/admin/components/AdminUI";

export function AdminSettingsPage() {
  const { notify } = useToast();
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSettings(await adminGetSettings());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được cấu hình");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải cấu hình khi mở trang
    void load();
  }, [load]);

  // Parse chuỗi thành JSON nếu hợp lệ (true/false/số/JSON), nếu không thì lưu dạng chuỗi.
  const parseValue = (raw: string): unknown => {
    const trimmed = raw.trim();
    if (trimmed === "") return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  };

  const saveSetting = async (key: string, rawValue: string) => {
    setBusy(true);
    try {
      await adminSetSetting(key, parseValue(rawValue));
      notify({ title: "Đã lưu cấu hình", tone: "success" });
      void load();
    } catch (err) {
      notify({ title: "Không lưu được", message: err instanceof Error ? err.message : "Có lỗi xảy ra", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const addSetting = async () => {
    if (!newKey.trim()) return;
    await saveSetting(newKey.trim(), newValue);
    setNewKey("");
    setNewValue("");
  };

  return (
    <div>
      <AdminPageHeader
        title="Cấu hình ứng dụng"
        description="Các thiết lập key/value toàn cục (feature flag, chế độ bảo trì, giới hạn…)."
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <GlassPanel className="p-5">
          <p className="ui-eyebrow">Thiết lập hiện có</p>
          {loading ? (
            <div className="mt-3 flex items-center gap-3 text-sm font-extrabold text-cosmic-mist">
              <Loader2 size={18} className="animate-spin text-cosmic-rose" aria-hidden="true" /> Đang tải…
            </div>
          ) : error ? (
            <p className="mt-3 text-sm font-semibold text-[#ffd7e4]">{error}</p>
          ) : settings.length === 0 ? (
            <p className="mt-3 text-sm font-semibold text-cosmic-mist">Chưa có thiết lập nào.</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {settings.map((setting) => (
                <SettingRow key={setting.key} setting={setting} busy={busy} onSave={saveSetting} />
              ))}
            </ul>
          )}
        </GlassPanel>

        <GlassPanel className="p-5">
          <p className="ui-eyebrow">Thêm / cập nhật</p>
          <div className="mt-3 grid gap-3">
            <TextField label="Khoá" value={newKey} onChange={(event) => setNewKey(event.target.value)} placeholder="maintenance_mode" />
            <TextField label="Giá trị" value={newValue} onChange={(event) => setNewValue(event.target.value)} placeholder='true / "text" / 100' />
            <div className="flex justify-end">
              <ActionButton icon={<Plus size={15} />} onClick={addSetting} disabled={busy || !newKey.trim()}>
                Lưu
              </ActionButton>
            </div>
            <p className="text-[11.5px] font-medium text-[color:var(--ui-text-soft)]">
              Giá trị nhập dạng JSON nếu có thể (ví dụ <code>true</code>, <code>100</code>), nếu không sẽ lưu như chuỗi.
            </p>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

function SettingRow({
  setting,
  busy,
  onSave
}: {
  setting: AdminSetting;
  busy: boolean;
  onSave: (key: string, rawValue: string) => Promise<void>;
}) {
  const [value, setValue] = useState(
    typeof setting.value === "string" ? setting.value : JSON.stringify(setting.value)
  );

  return (
    <li className="rounded-[12px] border border-white/8 bg-white/[0.03] p-3">
      <p className="font-mono text-[12.5px] font-bold text-white">{setting.key}</p>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="h-9 min-w-0 flex-1 rounded-[10px] border border-white/12 bg-white/5 px-2 text-[13px] font-semibold text-white"
        />
        <button
          type="button"
          onClick={() => onSave(setting.key, value)}
          disabled={busy}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-white/10 text-white transition hover:bg-white/6 disabled:opacity-50"
          title="Lưu"
        >
          <Save size={14} />
        </button>
      </div>
    </li>
  );
}
