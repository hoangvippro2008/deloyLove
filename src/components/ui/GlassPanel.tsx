import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type GlassPanelProps = ComponentPropsWithoutRef<"div">;

export function GlassPanel({ className, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "only-surface rounded-[14px]",
        className
      )}
      {...props}
    />
  );
}
