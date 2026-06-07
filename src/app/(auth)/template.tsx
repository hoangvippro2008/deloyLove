"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// Chuyển trang mềm cho khu vực đăng nhập/đăng ký.
export default function AuthTemplate({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
