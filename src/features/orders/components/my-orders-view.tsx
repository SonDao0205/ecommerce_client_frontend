"use client";

import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  MapPin,
  PackageSearch,
  Phone,
  ReceiptText,
  RefreshCw,
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
import { cn } from "@/lib/utils";

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Chờ xác nhận", className: "bg-amber-50 text-amber-700" },
  confirmed: { label: "Đã xác nhận", className: "bg-blue-50 text-blue-700" },
  processing: { label: "Đang xử lý", className: "bg-violet-50 text-violet-700" },
  shipping: { label: "Đang giao hàng", className: "bg-cyan-50 text-cyan-700" },
  completed: { label: "Đã hoàn thành", className: "bg-green-50 text-green-700" },
  cancelled: { label: "Đã hủy", className: "bg-zinc-100 text-zinc-700" },
  rejected: { label: "Đã từ chối", className: "bg-red-50 text-red-700" },
};

const filters: { label: string; value: OrderStatus | "" }[] = [
  { label: "Tất cả", value: "" },
  { label: "Chờ xác nhận", value: "pending" },
  { label: "Đã xác nhận", value: "confirmed" },
  { label: "Đang xử lý", value: "processing" },
  { label: "Đang giao", value: "shipping" },
  { label: "Hoàn thành", value: "completed" },
  { label: "Đã từ chối", value: "rejected" },
];

const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value) + "₫";
const dateTime = (value: string) => new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

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

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await orderService.getMyOrders({ page, limit: 8, status: status || undefined });
      setOrders(result.items);
      setMeta(result.meta);
    } catch (error) {
      toast.error("Không thể tải đơn hàng", { description: error instanceof ApiError ? error.message : "Vui lòng thử lại sau." });
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

  async function openDetail(id: string) {
    setDetailLoading(true);
    try {
      setDetail(await orderService.getMyOrder(id));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Không thể tải chi tiết đơn hàng.");
    } finally {
      setDetailLoading(false);
    }
  }

  if (authLoading || !user) return <div className="grid min-h-96 place-items-center"><LoaderCircle className="size-8 animate-spin text-[#ff5a1f]" /></div>;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold text-[#ff5a1f]">Tài khoản của tôi</p><h1 className="mt-1 text-3xl font-bold">Đơn hàng đã đặt</h1><p className="mt-2 text-sm text-muted-foreground">Theo dõi trạng thái và xem lại sản phẩm của từng đơn hàng.</p></div>
        <Button variant="outline" disabled={loading} onClick={() => void loadOrders()}><RefreshCw className={loading ? "animate-spin" : ""} /> Làm mới</Button>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto rounded-xl border bg-white p-2">
        {filters.map((filter) => <button key={filter.value || "all"} type="button" onClick={() => { setStatus(filter.value); setPage(1); }} className={cn("shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition", status === filter.value ? "bg-[#ff5a1f] text-white" : "hover:bg-zinc-100")}>{filter.label}</button>)}
      </div>

      {loading ? <div className="space-y-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-44 animate-pulse rounded-2xl border bg-white" />)}</div> : orders.length === 0 ? <div className="rounded-2xl border bg-white p-16 text-center"><PackageSearch className="mx-auto size-14 text-zinc-300" /><h2 className="mt-4 text-xl font-bold">Chưa có đơn hàng</h2><p className="mt-2 text-sm text-muted-foreground">Không tìm thấy đơn hàng phù hợp với trạng thái đã chọn.</p><Button className="mt-5 bg-[#ff5a1f] text-white" onClick={() => router.push("/")}>Tiếp tục mua sắm</Button></div> : <div className="space-y-4">
        {orders.map((order) => <article key={order.id} className="overflow-hidden rounded-2xl border bg-white">
          <div className="flex flex-col gap-3 border-b bg-zinc-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><strong>{order.orderCode}</strong><span className="ml-3 text-xs text-muted-foreground">{dateTime(order.createdAt)}</span></div><StatusBadge status={order.status} /></div>
          <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center"><div className="grid gap-3 text-sm sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Người nhận</p><p className="mt-1 font-medium">{order.recipientName}</p></div><div><p className="text-xs text-muted-foreground">Số sản phẩm</p><p className="mt-1 font-medium">{order.itemCount} sản phẩm</p></div><div><p className="text-xs text-muted-foreground">Tổng thanh toán</p><p className="mt-1 text-lg font-bold text-[#ff5a1f]">{money(order.totalAmount)}</p></div>{order.rejectionReason && <div className="rounded-lg bg-red-50 p-3 text-red-700 sm:col-span-3"><strong>Lý do từ chối:</strong> {order.rejectionReason}</div>}</div><Button variant="outline" onClick={() => void openDetail(order.id)}><Eye /> Xem chi tiết</Button></div>
        </article>)}
      </div>}

      {meta && meta.totalPages > 1 && <div className="mt-6 flex items-center justify-center gap-3"><Button size="icon-sm" variant="outline" disabled={!meta.hasPreviousPage || loading} onClick={() => setPage((value) => value - 1)}><ChevronLeft /></Button><span className="text-sm">Trang {meta.page}/{meta.totalPages}</span><Button size="icon-sm" variant="outline" disabled={!meta.hasNextPage || loading} onClick={() => setPage((value) => value + 1)}><ChevronRight /></Button></div>}

      {(detail || detailLoading) && <OrderDetailDialog order={detail} loading={detailLoading} onClose={() => { if (!detailLoading) setDetail(undefined); }} />}
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return <span className={cn("w-fit rounded-full px-3 py-1 text-xs font-semibold", config.className)}>{config.label}</span>;
}

function OrderDetailDialog({ order, loading, onClose }: { order?: Order; loading: boolean; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-[#ff5a1f]">Chi tiết đơn hàng</p><h2 className="mt-1 text-xl font-bold">{order?.orderCode ?? "Đang tải..."}</h2></div><Button size="icon-sm" variant="ghost" disabled={loading} onClick={onClose}><X /></Button></div>
    {loading || !order ? <div className="grid min-h-64 place-items-center"><LoaderCircle className="size-8 animate-spin text-[#ff5a1f]" /></div> : <div className="mt-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zinc-50 p-4"><StatusBadge status={order.status} /><strong className="text-xl text-[#ff5a1f]">{money(order.totalAmount)}</strong></div>
      <div className="grid gap-3 text-sm sm:grid-cols-2"><Info icon={Phone} label="Người nhận" value={`${order.recipientName} · ${order.recipientPhone}`} /><Info icon={MapPin} label="Địa chỉ giao hàng" value={order.shippingAddress} />{order.note && <Info icon={ReceiptText} label="Ghi chú" value={order.note} />}</div>
      {order.rejectionReason && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><strong>Lý do từ chối:</strong> {order.rejectionReason}</div>}
      <div className="divide-y overflow-hidden rounded-xl border">{order.items.map((item) => <div key={item.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-semibold">{item.productName}</p>{item.variantValue && <p className="mt-1 text-xs text-muted-foreground">{item.variantName}: {item.variantValue}{item.variantSku ? ` · SKU: ${item.variantSku}` : ""}</p>}<p className="mt-1 text-xs text-muted-foreground">{item.quantity} × {money(item.unitPrice)}</p></div><strong>{money(item.subtotal)}</strong></div>)}</div>
    </div>}
  </div></div>;
}

function Info({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return <div className="flex gap-3 rounded-xl border p-3"><Icon className="mt-0.5 size-4 shrink-0 text-[#ff5a1f]" /><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div></div>;
}
