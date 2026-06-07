"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// Chuyển trang mềm: nội dung trang fade + trượt lên nhẹ mỗi lần điều hướng.
export default function DashboardTemplate({ children }: { children: ReactNode }) {
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
