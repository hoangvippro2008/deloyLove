"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/providers/AuthProvider";

type ActionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
  href?: string;
  children: ReactNode;
  icon?: ReactNode;
  requiresAuth?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

const variants = {
  primary: "only-button-primary",
  secondary: "only-button-secondary",
  ghost: "text-[color:var(--ui-text-muted)] hover:bg-white/10 hover:text-white"
};

export function ActionButton({
  href,
  children,
  icon,
  onClick,
  requiresAuth = false,
  variant = "secondary",
  className,
  ...buttonProps
}: ActionButtonProps) {
  const { requireAuth } = useAuth();

  const content = (
    <>
      {icon}
      <span>{children}</span>
    </>
  );

  const buttonClassName = cn(
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    className
  );

  if (!href) {
    return (
      <button
        className={buttonClassName}
        onClick={(event) => {
          if (requiresAuth && !requireAuth()) {
            event.preventDefault();
            return;
          }

          onClick?.(event);
        }}
        {...buttonProps}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={buttonClassName}
      onClick={(event) => {
        if (requiresAuth && !requireAuth()) {
          event.preventDefault();
        }
      }}
    >
      {content}
    </Link>
  );
}
