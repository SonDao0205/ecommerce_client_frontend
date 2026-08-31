"use client";
import Image from "next/image";
import { ImagePlus, LoaderCircle, Star, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/src/core/api";
import type { OrderItem } from "@/src/features/orders/types/order";
import { useDebouncedCallback } from "@/src/hooks/use-debounced-callback";
import { reviewService } from "../api/review.service";
import type { ProductReview } from "../types/review";

export function ReviewFormDialog({
  item,
  onClose,
  onCreated,
}: {
  item: OrderItem;
  onClose: () => void;
  onCreated: (review: ProductReview) => void;
}) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [queued, setQueued] = useState(false);
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);
  const create = useDebouncedCallback(async () => {
    setPending(true);
    try {
      const review = await reviewService.create(
        item.id,
        rating,
        content.trim(),
        files,
      );
      toast.success("Đánh giá sản phẩm thành công");
      onCreated(review);
      onClose();
    } catch (cause) {
      toast.error("Không thể gửi đánh giá", {
        description:
          cause instanceof ApiError ? cause.message : "Vui lòng thử lại sau.",
      });
    } finally {
      lock.current = false;
      setQueued(false);
      setPending(false);
    }
  }, 400);
  function selectFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files, ...Array.from(list)].slice(0, 6);
    const invalid = next.find((file) => {
      const video = file.type.startsWith("video/");
      return (
        (!video && !file.type.startsWith("image/")) ||
        file.size > (video ? 50 * 1024 * 1024 : 5 * 1024 * 1024)
      );
    });
    if (invalid) {
      setError(`${invalid.name}: ảnh tối đa 5 MB, video tối đa 50 MB.`);
      return;
    }
    setFiles(next);
    setError("");
  }
  function submit() {
    if (lock.current || pending || queued) return;
    if (content.trim().length < 5) {
      setError("Nội dung đánh giá phải có ít nhất 5 ký tự.");
      return;
    }
    lock.current = true;
    setQueued(true);
    create();
  }
  const busy = queued || pending;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#ff5a1f]">
              Đánh giá sản phẩm
            </p>
            <h2 className="mt-1 text-lg font-bold">{item.productName}</h2>
            {item.variantValue && (
              <p className="mt-1 text-xs text-muted-foreground">
                {item.variantName}: {item.variantValue}
                {item.variantSku ? ` · ${item.variantSku}` : ""}
              </p>
            )}
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={busy}
            onClick={onClose}
          >
            <X />
          </Button>
        </div>
        <div className="mt-5">
          <p className="text-sm font-semibold">Mức độ hài lòng</p>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                disabled={busy}
                onClick={() => setRating(star)}
                aria-label={`${star} sao`}
              >
                <Star
                  className={`size-8 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-300"}`}
                />
              </button>
            ))}
          </div>
        </div>
        <label className="mt-5 block text-sm font-semibold">
          Nội dung đánh giá
          <textarea
            value={content}
            disabled={busy}
            maxLength={2000}
            onChange={(e) => {
              setContent(e.target.value);
              setError("");
            }}
            rows={5}
            className="mt-2 w-full resize-y rounded-xl border p-3 text-sm font-normal outline-none focus:border-[#ff5a1f]"
            placeholder="Chia sẻ trải nghiệm của bạn..."
          />
        </label>
        <div className="mt-4">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-zinc-50">
            <ImagePlus className="size-4" />
            Thêm ảnh/video
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              disabled={busy || files.length >= 6}
              onChange={(e) => selectFiles(e.target.files)}
              className="hidden"
            />
          </label>
          <span className="ml-3 text-xs text-muted-foreground">
            Tối đa 6 file
          </span>
        </div>
        {files.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="group relative aspect-square overflow-hidden rounded-lg border bg-zinc-50"
              >
                {file.type.startsWith("video/") ? (
                  <video
                    src={previews[index]}
                    muted
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={previews[index]}
                    alt={file.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    setFiles((current) => current.filter((_, i) => i !== index))
                  }
                  className="absolute right-1 top-1 rounded bg-black/65 p-1 text-white"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" disabled={busy} onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={busy}
            onClick={submit}
            className="bg-[#ff5a1f] text-white hover:bg-[#e94b13]"
          >
            {busy && <LoaderCircle className="animate-spin" />}
            {pending
              ? "Đang tải media..."
              : queued
                ? "Đang gửi..."
                : "Gửi đánh giá"}
          </Button>
        </div>
      </div>
    </div>
  );
}
