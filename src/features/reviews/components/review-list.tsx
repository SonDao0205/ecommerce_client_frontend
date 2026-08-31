"use client";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MessageSquareReply,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/src/core/api";
import { reviewService } from "../api/review.service";
import type { ProductReview, ProductReviewPage } from "../types/review";

const date = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(
    new Date(value),
  );
export function ProductReviewsPreview({ slug }: { slug: string }) {
  const [data, setData] = useState<ProductReviewPage>();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    reviewService
      .getProductReviews(slug, 1, 4)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);
  return (
    <section className="mt-5 rounded-2xl border bg-white p-5 sm:p-6">
      <ReviewHeading data={data} title="Đánh giá từ khách hàng" />
      {loading ? (
        <Loading />
      ) : data?.items.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {data.items.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <Empty />
      )}
      <div className="mt-5 flex justify-end">
        <Button
          nativeButton={false}
          variant="outline"
          render={
            <Link href={`/products/${encodeURIComponent(slug)}/reviews`} />
          }
        >
          Xem toàn bộ đánh giá
        </Button>
      </div>
    </section>
  );
}
export function AllProductReviews({ slug }: { slug: string }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ProductReviewPage>();
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await reviewService.getProductReviews(slug, page, 8));
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Không thể tải đánh giá.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, slug]);
  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);
  return (
    <div>
      <ReviewHeading data={data} title="Tất cả đánh giá" />
      {loading ? (
        <Loading />
      ) : data?.items.length ? (
        <div className="mt-5 space-y-4">
          {data.items.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <Empty />
      )}
      {data && data.meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            size="icon-sm"
            variant="outline"
            disabled={!data.meta.hasPreviousPage || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft />
          </Button>
          <span className="text-sm">
            Trang {data.meta.page}/{data.meta.totalPages}
          </span>
          <Button
            size="icon-sm"
            variant="outline"
            disabled={!data.meta.hasNextPage || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}
function ReviewHeading({
  data,
  title,
}: {
  data?: ProductReviewPage;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Những nhận xét từ khách hàng đã mua sản phẩm.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Star className="size-6 fill-amber-400 text-amber-400" />
        <strong className="text-2xl">
          {data?.summary.averageRating.toFixed(1) ?? "0.0"}
        </strong>
        <span className="text-sm text-muted-foreground">
          / 5 · {data?.summary.reviewCount ?? 0} đánh giá
        </span>
      </div>
    </div>
  );
}
export function ReviewCard({ review }: { review: ProductReview }) {
  return (
    <article className="rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <strong>{review.userName}</strong>
          <p className="mt-1 text-xs text-muted-foreground">
            {date(review.createdAt)}
          </p>
        </div>
        <Stars rating={review.rating} />
      </div>
      {review.variantValue && (
        <p className="mt-3 inline-flex rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
          Phân loại: {review.variantName}: {review.variantValue}
          {review.variantSku ? ` · ${review.variantSku}` : ""}
        </p>
      )}
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
        {review.content}
      </p>
      {review.media.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.media.map((asset) => (
            <a
              key={asset.publicId}
              href={asset.url}
              target="_blank"
              rel="noreferrer"
              className="relative size-20 overflow-hidden rounded-lg border bg-zinc-50 sm:size-24"
            >
              {asset.resourceType === "video" ? (
                <video
                  src={asset.url}
                  muted
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={asset.url}
                  alt="Ảnh đánh giá"
                  fill
                  unoptimized
                  className="object-cover"
                />
              )}
            </a>
          ))}
        </div>
      )}
      {review.adminReply && (
        <div className="mt-4 rounded-lg bg-orange-50 p-3 text-sm text-orange-900">
          <p className="flex items-center gap-2 font-semibold">
            <MessageSquareReply className="size-4" /> Phản hồi từ ShopNow
          </p>
          <p className="mt-1 whitespace-pre-wrap leading-6">
            {review.adminReply}
          </p>
        </div>
      )}
    </article>
  );
}
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`size-4 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-300"}`}
        />
      ))}
    </div>
  );
}
function Loading() {
  return (
    <div className="grid min-h-36 place-items-center">
      <LoaderCircle className="animate-spin text-[#ff5a1f]" />
    </div>
  );
}
function Empty() {
  return (
    <div className="mt-5 rounded-xl bg-zinc-50 p-10 text-center text-sm text-muted-foreground">
      Sản phẩm chưa có đánh giá.
    </div>
  );
}
