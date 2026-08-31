"use client";

import { useRouter } from "next/navigation";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Eye,
  ImagePlus,
  LoaderCircle,
  MapPin,
  PackageSearch,
  Phone,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/src/core/api";
import { orderService } from "../api/order.service";
import type { Order, OrderStatus, OrderSummary } from "../types/order";
import type { PaginationMeta } from "@/src/types/api";
import { useAuth } from "@/src/providers/storefront-provider";
import { useDebouncedCallback } from "@/src/hooks/use-debounced-callback";
import { cn } from "@/lib/utils";
import { ReviewFormDialog } from "@/src/features/reviews/components/review-form-dialog";
import type { OrderItem } from "../types/order";

const statusConfig: Record<OrderStatus, { label: string; className: string }> =
  {
    pending: { label: "Chờ xác nhận", className: "bg-amber-50 text-amber-700" },
    confirmed: { label: "Đã xác nhận", className: "bg-blue-50 text-blue-700" },
    processing: {
      label: "Đang xử lý",
      className: "bg-violet-50 text-violet-700",
    },
    shipping: {
      label: "Đang giao hàng",
      className: "bg-cyan-50 text-cyan-700",
    },
    completed: {
      label: "Đã hoàn thành",
      className: "bg-green-50 text-green-700",
    },
    cancelled: { label: "Đã hủy", className: "bg-zinc-100 text-zinc-700" },
    rejected: { label: "Đã từ chối", className: "bg-red-50 text-red-700" },
    return_requested: {
      label: "Chờ duyệt hoàn trả",
      className: "bg-orange-50 text-orange-700",
    },
    returned: {
      label: "Đã hoàn trả",
      className: "bg-emerald-50 text-emerald-700",
    },
    return_rejected: {
      label: "Từ chối hoàn trả",
      className: "bg-red-50 text-red-700",
    },
  };

const filters: { label: string; value: OrderStatus | "" }[] = [
  { label: "Tất cả", value: "" },
  { label: "Chờ xác nhận", value: "pending" },
  { label: "Đã xác nhận", value: "confirmed" },
  { label: "Đang xử lý", value: "processing" },
  { label: "Đang giao", value: "shipping" },
  { label: "Hoàn thành", value: "completed" },
  { label: "Chờ hoàn trả", value: "return_requested" },
  { label: "Đã hoàn trả", value: "returned" },
  { label: "Đã từ chối", value: "rejected" },
];

const money = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + "₫";
const dateTime = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function MyOrdersView() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Order>();
  const [detailLoading, setDetailLoading] = useState(false);
  const [action, setAction] = useState<{
    type: "cancel" | "return";
    order: OrderSummary;
  }>();
  const [actionPending, setActionPending] = useState(false);
  const [reviewItem, setReviewItem] = useState<OrderItem>();

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await orderService.getMyOrders({
        page,
        limit: 8,
        status: status || undefined,
      });
      setOrders(result.items);
      setMeta(result.meta);
    } catch (error) {
      toast.error("Không thể tải đơn hàng", {
        description:
          error instanceof ApiError ? error.message : "Vui lòng thử lại sau.",
      });
    } finally {
      setLoading(false);
    }
  }, [user, page, status]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    queueMicrotask(() => void loadOrders());
  }, [authLoading, user, router, loadOrders]);

  const fetchDetail = useDebouncedCallback(async (id: string) => {
    try {
      setDetail(await orderService.getMyOrder(id));
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Không thể tải chi tiết đơn hàng.",
      );
    } finally {
      setDetailLoading(false);
    }
  }, 300);

  function openDetail(id: string) {
    if (detailLoading) return;
    setDetailLoading(true);
    fetchDetail(id);
  }

  async function submitAction(reason: string, files: File[]) {
    if (!action) return;
    setActionPending(true);
    try {
      const updated =
        action.type === "cancel"
          ? await orderService.cancelMyOrder(action.order.id, reason)
          : await orderService.requestReturn(action.order.id, reason, files);
      toast.success(
        action.type === "cancel"
          ? "Đã hủy đơn và hoàn lại tồn kho"
          : "Đã gửi yêu cầu hoàn trả",
      );
      setAction(undefined);
      if (detail?.id === updated.id) setDetail(updated);
      await loadOrders();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Không thể xử lý yêu cầu.",
      );
    } finally {
      setActionPending(false);
    }
  }

  if (authLoading || !user)
    return (
      <div className="grid min-h-96 place-items-center">
        <LoaderCircle className="size-8 animate-spin text-[#ff5a1f]" />
      </div>
    );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#ff5a1f]">
            Tài khoản của tôi
          </p>
          <h1 className="mt-1 text-3xl font-bold">Đơn hàng đã đặt</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Theo dõi trạng thái và xem lại sản phẩm của từng đơn hàng.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => void loadOrders()}
        >
          <RefreshCw className={loading ? "animate-spin" : ""} /> Làm mới
        </Button>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto rounded-xl border bg-white p-2">
        {filters.map((filter) => (
          <button
            key={filter.value || "all"}
            type="button"
            onClick={() => {
              setStatus(filter.value);
              setPage(1);
            }}
            className={cn(
              "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition",
              status === filter.value
                ? "bg-[#ff5a1f] text-white"
                : "hover:bg-zinc-100",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-2xl border bg-white"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border bg-white p-16 text-center">
          <PackageSearch className="mx-auto size-14 text-zinc-300" />
          <h2 className="mt-4 text-xl font-bold">Chưa có đơn hàng</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Không tìm thấy đơn hàng phù hợp với trạng thái đã chọn.
          </p>
          <Button
            className="mt-5 bg-[#ff5a1f] text-white"
            onClick={() => router.push("/")}
          >
            Tiếp tục mua sắm
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article
              key={order.id}
              className="overflow-hidden rounded-2xl border bg-white"
            >
              <div className="flex flex-col gap-3 border-b bg-zinc-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <strong>{order.orderCode}</strong>
                  <span className="ml-3 text-xs text-muted-foreground">
                    {dateTime(order.createdAt)}
                  </span>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Người nhận</p>
                    <p className="mt-1 font-medium">{order.recipientName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Số sản phẩm</p>
                    <p className="mt-1 font-medium">
                      {order.itemCount} sản phẩm
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Tổng thanh toán
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#ff5a1f]">
                      {money(order.totalAmount)}
                    </p>
                  </div>
                  {order.rejectionReason && (
                    <div className="rounded-lg bg-red-50 p-3 text-red-700 sm:col-span-3">
                      <strong>Lý do từ chối:</strong> {order.rejectionReason}
                    </div>
                  )}
                  {order.cancellationReason && (
                    <div className="rounded-lg bg-zinc-50 p-3 text-zinc-700 sm:col-span-3">
                      <strong>Lý do hủy:</strong> {order.cancellationReason}
                    </div>
                  )}
                  {order.returnReviewReason && (
                    <div className="rounded-lg bg-orange-50 p-3 text-orange-800 sm:col-span-3">
                      <strong>Phản hồi hoàn trả:</strong>{" "}
                      {order.returnReviewReason}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => void openDetail(order.id)}
                  >
                    <Eye /> Xem chi tiết
                  </Button>
                  {(order.status === "pending" ||
                    order.status === "confirmed") && (
                    <Button
                      variant="outline"
                      className="text-red-600"
                      onClick={() => setAction({ type: "cancel", order })}
                    >
                      <Ban /> Hủy đơn
                    </Button>
                  )}
                  {canRequestReturn(order) && (
                    <Button
                      className="bg-[#ff5a1f] text-white hover:bg-[#e94b13]"
                      onClick={() => setAction({ type: "return", order })}
                    >
                      <RotateCcw /> Yêu cầu trả hàng
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            size="icon-sm"
            variant="outline"
            disabled={!meta.hasPreviousPage || loading}
            onClick={() => setPage((value) => value - 1)}
          >
            <ChevronLeft />
          </Button>
          <span className="text-sm">
            Trang {meta.page}/{meta.totalPages}
          </span>
          <Button
            size="icon-sm"
            variant="outline"
            disabled={!meta.hasNextPage || loading}
            onClick={() => setPage((value) => value + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      )}

      {(detail || detailLoading) && (
        <OrderDetailDialog
          order={detail}
          loading={detailLoading}
          onClose={() => {
            if (!detailLoading) setDetail(undefined);
          }}
          onReview={setReviewItem}
        />
      )}
      {action && (
        <OrderActionDialog
          type={action.type}
          order={action.order}
          pending={actionPending}
          onClose={() => {
            if (!actionPending) setAction(undefined);
          }}
          onSubmit={submitAction}
        />
      )}
      {reviewItem && (
        <ReviewFormDialog
          item={reviewItem}
          onClose={() => setReviewItem(undefined)}
          onCreated={(review) => {
            setDetail((current) =>
              current
                ? {
                    ...current,
                    items: current.items.map((item) =>
                      item.id === reviewItem.id
                        ? { ...item, reviewId: review.id }
                        : item,
                    ),
                  }
                : current,
            );
          }}
        />
      )}
    </div>
  );
}

function canRequestReturn(order: OrderSummary): boolean {
  if (order.status !== "completed" || !order.confirmedAt) return false;
  return (
    Date.now() <=
    new Date(order.confirmedAt).getTime() + 7 * 24 * 60 * 60 * 1000
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "w-fit rounded-full px-3 py-1 text-xs font-semibold",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}

function OrderDetailDialog({
  order,
  loading,
  onClose,
  onReview,
}: {
  order?: Order;
  loading: boolean;
  onClose: () => void;
  onReview: (item: OrderItem) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#ff5a1f]">
              Chi tiết đơn hàng
            </p>
            <h2 className="mt-1 text-xl font-bold">
              {order?.orderCode ?? "Đang tải..."}
            </h2>
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={loading}
            onClick={onClose}
          >
            <X />
          </Button>
        </div>
        {loading || !order ? (
          <div className="grid min-h-64 place-items-center">
            <LoaderCircle className="size-8 animate-spin text-[#ff5a1f]" />
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zinc-50 p-4">
              <StatusBadge status={order.status} />
              <strong className="text-xl text-[#ff5a1f]">
                {money(order.totalAmount)}
              </strong>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <Info
                icon={Phone}
                label="Người nhận"
                value={`${order.recipientName} · ${order.recipientPhone}`}
              />
              <Info
                icon={MapPin}
                label="Địa chỉ giao hàng"
                value={order.shippingAddress}
              />
              {order.note && (
                <Info icon={ReceiptText} label="Ghi chú" value={order.note} />
              )}
            </div>
            {order.rejectionReason && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <strong>Lý do từ chối:</strong> {order.rejectionReason}
              </div>
            )}
            {order.cancellationReason && (
              <div className="rounded-xl border bg-zinc-50 p-4 text-sm">
                <strong>Lý do hủy:</strong> {order.cancellationReason}
              </div>
            )}
            {order.returnReason && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
                <strong>Lý do yêu cầu hoàn trả:</strong> {order.returnReason}
              </div>
            )}
            {order.returnEvidence.length > 0 && (
              <EvidenceGallery evidence={order.returnEvidence} />
            )}
            {order.returnReviewReason && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <strong>Phản hồi của cửa hàng:</strong>{" "}
                {order.returnReviewReason}
              </div>
            )}
            <div className="divide-y overflow-hidden rounded-xl border">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <p className="font-semibold">{item.productName}</p>
                    {item.variantValue && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.variantName}: {item.variantValue}
                        {item.variantSku ? ` · SKU: ${item.variantSku}` : ""}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.quantity} × {money(item.unitPrice)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <strong>{money(item.subtotal)}</strong>
                    {order.status === "completed" &&
                      item.productId &&
                      (item.reviewId ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Đã đánh giá
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onReview(item)}
                        >
                          <Star /> Đánh giá
                        </Button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderActionDialog({
  type,
  order,
  pending,
  onClose,
  onSubmit,
}: {
  type: "cancel" | "return";
  order: OrderSummary;
  pending: boolean;
  onClose: () => void;
  onSubmit: (reason: string, files: File[]) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [queued, setQueued] = useState(false);
  const busy = pending || queued;
  const submitAction = useDebouncedCallback(
    async (value: string, selectedFiles: File[]) => {
      try {
        await onSubmit(value, selectedFiles);
      } finally {
        setQueued(false);
      }
    },
    400,
  );

  function selectFiles(selected: FileList | null) {
    if (!selected) return;
    const next = [...files, ...Array.from(selected)].slice(0, 6);
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
    if (busy) return;
    const value = reason.trim();
    if (value.length < 5) {
      setError("Lý do phải có ít nhất 5 ký tự.");
      return;
    }
    setQueued(true);
    submitAction(value, files);
  }

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#ff5a1f]">
              {order.orderCode}
            </p>
            <h2 className="mt-1 text-xl font-bold">
              {type === "cancel" ? "Hủy đơn hàng" : "Yêu cầu hoàn trả hàng"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {type === "cancel"
                ? "Tồn kho sẽ được hoàn lại ngay sau khi hủy thành công."
                : "Chỉ áp dụng trong 7 ngày kể từ khi đơn được xác nhận."}
            </p>
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
        <div className="mt-5 space-y-4">
          <label className="block space-y-2 text-sm font-medium">
            Lý do
            <textarea
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setError("");
              }}
              maxLength={1000}
              disabled={busy}
              className="min-h-28 w-full resize-y rounded-xl border p-3 outline-none focus:border-[#ff5a1f] focus:ring-2 focus:ring-orange-100"
              placeholder={
                type === "cancel"
                  ? "Nhập lý do hủy đơn..."
                  : "Mô tả tình trạng sản phẩm cần hoàn trả..."
              }
            />
          </label>
          {type === "return" && (
            <div>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-sm font-semibold text-[#ff5a1f] hover:bg-orange-50">
                <ImagePlus className="size-5" /> Thêm hình ảnh hoặc video
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  disabled={busy || files.length >= 6}
                  onChange={(event) => {
                    selectFiles(event.target.files);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                Tối đa 6 tệp · ảnh 5 MB · video 50 MB.
              </p>
              {files.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {files.map((file, index) => (
                    <SelectedEvidence
                      key={`${file.name}-${file.lastModified}-${index}`}
                      file={file}
                      onRemove={() =>
                        setFiles((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={busy} onClick={onClose}>
              Đóng
            </Button>
            <Button
              disabled={busy}
              className={
                type === "cancel"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-[#ff5a1f] text-white hover:bg-[#e94b13]"
              }
              onClick={submit}
            >
              {busy && <LoaderCircle className="animate-spin" />}
              {type === "cancel" ? "Xác nhận hủy" : "Gửi yêu cầu"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectedEvidence({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const [url] = useState(() => URL.createObjectURL(file));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <div className="relative overflow-hidden rounded-xl border bg-zinc-50">
      {file.type.startsWith("video/") ? (
        <video src={url} className="h-28 w-full object-cover" muted />
      ) : (
        <img src={url} alt={file.name} className="h-28 w-full object-cover" />
      )}
      <button
        type="button"
        className="absolute right-1 top-1 grid size-7 cursor-pointer place-items-center rounded-full bg-black/65 text-white"
        onClick={onRemove}
      >
        <Trash2 className="size-3.5" />
      </button>
      <p className="truncate px-2 py-1.5 text-[10px]">{file.name}</p>
    </div>
  );
}

function EvidenceGallery({ evidence }: { evidence: Order["returnEvidence"] }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">Minh chứng hoàn trả</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {evidence.map((asset) => (
          <a
            key={asset.publicId}
            href={asset.url}
            target="_blank"
            rel="noreferrer"
            className="overflow-hidden rounded-xl border bg-zinc-50"
          >
            {asset.resourceType === "video" ? (
              <video
                src={asset.url}
                controls
                className="h-32 w-full object-cover"
              />
            ) : (
              <img
                src={asset.url}
                alt="Minh chứng sản phẩm lỗi"
                className="h-32 w-full object-cover"
              />
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-[#ff5a1f]" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 font-medium">{value}</p>
      </div>
    </div>
  );
}
