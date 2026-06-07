"use client";

import type { PropsWithChildren } from "react";
import { GameInvitePrompt } from "@/components/game/GameInvitePrompt";
import { LetterArrivalPrompt } from "@/components/letters/LetterArrivalPrompt";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { AuthProvider } from "@/providers/AuthProvider";

export function Providers({ children }: PropsWithChildren) {
  return (
    <ToastProvider>
      <AuthProvider>
        {children}
        <LetterArrivalPrompt />
        <GameInvitePrompt />
      </AuthProvider>
    </ToastProvider>
  );
}
