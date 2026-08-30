"use client";

import { LoaderCircle, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Xác nhận",
  pending = false,
  onOpenChange,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onOpenChange(false);
      }}
    >
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600">
              <TriangleAlert className="size-5" />
            </span>
            <div>
              <h2 id="confirm-title" className="text-lg font-bold">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          </div>
          <Button type="button" size="icon-sm" variant="ghost" disabled={pending} aria-label="Đóng" onClick={() => onOpenChange(false)}>
            <X />
          </Button>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>Từ chối</Button>
          <Button type="button" disabled={pending} className="bg-red-600 text-white hover:bg-red-700" onClick={() => void onConfirm()}>
            {pending && <LoaderCircle className="animate-spin" />}
            {pending ? "Đang xử lý..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
