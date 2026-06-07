"use client";

import { useEffect } from "react";

// Đăng ký service worker để cài PWA ("Thêm vào màn hình chính").
// Chỉ bật ở production để không gây kẹt HMR khi dev.
export function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  return null;
}
