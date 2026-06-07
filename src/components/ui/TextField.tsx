import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  helper?: string;
  label: string;
  leftIcon?: ReactNode;
  error?: string;
};

export function TextField({ className, helper, label, leftIcon, error, id, ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined;

  return (
    <label htmlFor={inputId} className="grid gap-2 text-sm text-cosmic-mist">
      <span className="font-extrabold">{label}</span>
      <span className="relative block">
        {leftIcon ? (
          <span className="pointer-events-none absolute left-4 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-cosmic-rose">
            {leftIcon}
          </span>
        ) : null}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn("only-field", leftIcon ? "pl-12" : "", error ? "ring-1 ring-rose-400/70" : "", className)}
          {...props}
        />
      </span>
      {error ? (
        <span id={`${inputId}-error`} className="text-xs font-semibold leading-5 text-rose-300">
          {error}
        </span>
      ) : helper ? (
        <span id={`${inputId}-helper`} className="text-xs font-semibold leading-5 text-cosmic-mist/80">
          {helper}
        </span>
      ) : null}
    </label>
  );
}
