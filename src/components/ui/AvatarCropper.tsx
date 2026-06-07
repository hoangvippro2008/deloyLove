"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Loader2, Move, ZoomIn } from "lucide-react";

// Khung crop avatar: kéo để chỉnh vị trí, thanh trượt để phóng to.
// Xuất ảnh vuông mặc định 512px để avatar luôn đúng tỷ lệ.
const FRAME = 280; // kích thước khung xem trên màn hình (px)
const OUTPUT = 512; // kích thước ảnh xuất ra (px)

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function AvatarCropper({
  file,
  onCancel,
  onConfirm
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (cropped: File) => void;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [working, setWorking] = useState(false);
  const dragRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  // Nạp ảnh + canh giữa khung ngay khi có kích thước thật (set state trong onload, không phải trong thân effect)
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const cover = Math.max(FRAME / image.naturalWidth, FRAME / image.naturalHeight);
      setImg(image);
      setZoom(1);
      setOffset({
        x: (FRAME - image.naturalWidth * cover) / 2,
        y: (FRAME - image.naturalHeight * cover) / 2
      });
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const coverScale = img ? Math.max(FRAME / img.naturalWidth, FRAME / img.naturalHeight) : 1;
  const dispW = img ? img.naturalWidth * coverScale * zoom : FRAME;
  const dispH = img ? img.naturalHeight * coverScale * zoom : FRAME;

  // Clamp để ảnh luôn phủ kín khung (không hở mép) ở một mức zoom cho trước
  const clampOffset = (next: { x: number; y: number }, z: number) => {
    if (!img) return next;
    const w = img.naturalWidth * coverScale * z;
    const h = img.naturalHeight * coverScale * z;
    return { x: clamp(next.x, FRAME - w, 0), y: clamp(next.y, FRAME - h, 0) };
  };

  function handleZoom(nextZoom: number) {
    // phóng to neo vào tâm khung cho tự nhiên
    setOffset((prev) => {
      const oldScale = coverScale * zoom;
      const newScale = coverScale * nextZoom;
      const cx = (FRAME / 2 - prev.x) / oldScale;
      const cy = (FRAME / 2 - prev.y) / oldScale;
      return clampOffset({ x: FRAME / 2 - cx * newScale, y: FRAME / 2 - cy * newScale }, nextZoom);
    });
    setZoom(nextZoom);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { px: event.clientX, py: event.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.px;
    const dy = event.clientY - dragRef.current.py;
    setOffset(clampOffset({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy }, zoom));
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function confirmCrop() {
    if (!img) return;
    setWorking(true);
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setWorking(false);
      return;
    }
    const scale = coverScale * zoom;
    const srcSize = FRAME / scale;
    const srcX = -offset.x / scale;
    const srcY = -offset.y / scale;
    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setWorking(false);
          return;
        }
        const name = file.name.replace(/\.[^.]+$/, "") || "avatar";
        onConfirm(new File([blob], `${name}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9
    );
  }

  return (
    <div className="only-modal-backdrop fixed inset-0 z-[60] flex overflow-y-auto px-4 py-6" onClick={onCancel}>
      <div className="only-modal-card only-pop relative m-auto w-full max-w-[380px] p-5" onClick={(event) => event.stopPropagation()}>
        <p className="ui-eyebrow">Ảnh đại diện</p>
        <h3 className="ui-h2 mt-1 text-white">Chỉnh khung hình</h3>
        <p className="ui-caption mt-1 inline-flex items-center gap-1.5 text-[color:var(--ui-text-soft)]">
          <Move size={13} /> Kéo để di chuyển · trượt thanh để phóng to
        </p>

        <div className="mt-4 grid place-items-center">
          <div
            className="relative cursor-grab touch-none overflow-hidden rounded-full bg-[var(--ui-bg-deep)] ring-1 ring-white/12 active:cursor-grabbing"
            style={{ width: FRAME, height: FRAME }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {img ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute max-w-none select-none"
                  style={{ left: offset.x, top: offset.y, width: dispW, height: dispH }}
                />
                {/* vòng tròn hướng dẫn vùng sẽ hiển thị */}
                <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/30" />
              </>
            ) : (
              <div className="grid h-full w-full place-items-center text-[color:var(--ui-text-muted)]">
                <Loader2 className="animate-spin" size={22} />
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <ZoomIn size={16} className="shrink-0 text-[color:var(--ui-text-soft)]" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => handleZoom(Number(event.target.value))}
            aria-label="Phóng to ảnh"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/12 accent-[color:var(--ui-accent)]"
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" className="only-button-secondary" onClick={onCancel} disabled={working}>
            Huỷ
          </button>
          <button type="button" className="only-button-primary" onClick={confirmCrop} disabled={!img || working}>
            {working ? <Loader2 size={16} className="animate-spin" /> : null}
            Dùng ảnh này
          </button>
        </div>
      </div>
    </div>
  );
}
