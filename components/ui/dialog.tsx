"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/** Thin wrapper over the native <dialog> element: focus trap, Esc and backdrop come from the browser. */
export function Dialog({
  open,
  onClose,
  className,
  children,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "m-auto max-h-[90dvh] max-w-[calc(100vw-2rem)] rounded-lg border border-rule bg-surface p-0 text-fg shadow-lift backdrop:bg-[#0b1230]/50",
        className,
      )}
    >
      {open && children}
    </dialog>
  );
}
