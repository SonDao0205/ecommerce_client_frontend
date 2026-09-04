"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/src/core/api";
import { paymentService } from "../api/payment.service";
import type { Payment, PaymentStatus } from "../types/order";

export function PaymentResultView({
  initialResult,
  paymentId,
}: {
  initialResult: "success" | "error" | "cancel";
  paymentId?: string;
}) {
  const [payment, setPayment] = useState<Payment>();
  const [loading, setLoading] = useState(Boolean(paymentId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!paymentId) {
      queueMicrotask(() => {
        setLoading(false);
        setError("Thiếu mã thanh toán để kiểm tra trạng thái.");
      });
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const load = async () => {
      try {
        const result =
          initialResult === "cancel" && attempts === 0
            ? await paymentService.cancelMyPayment(paymentId)
            : await paymentService.getMyPayment(paymentId);
        if (cancelled) return;
        setPayment(result);
        setError("");
        attempts++;
        if (result.status === "pending" && attempts < 60) {
          timer = setTimeout(() => void load(), 2000);
        }
      } catch (cause) {
        if (cancelled) return;
        setError(
          cause instanceof ApiError
            ? cause.message
            : "Không thể kiểm tra trạng thái thanh toán.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [initialResult, paymentId]);

  const view = stateView(payment?.status, initialResult, loading);
  return (
    <section className="mx-auto max-w-xl rounded-2xl border bg-white p-6 text-center shadow-sm sm:p-10">
      <div className={`mx-auto grid size-16 place-items-center rounded-full ${view.iconClass}`}>
        {view.icon}
      </div>
      <h1 className="mt-5 text-2xl font-bold">{view.title}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {error || view.description}
      </p>
      {payment && (
        <div className="mt-6 rounded-xl bg-zinc-50 p-4 text-left text-sm">
          <Info label="Mã thanh toán" value={payment.invoiceNumber} />
          <Info label="Số tiền" value={`${new Intl.NumberFormat("vi-VN").format(payment.amount)}₫`} />
          {payment.transactionId && (
            <Info label="Mã giao dịch SePay" value={payment.transactionId} />
          )}
        </div>
      )}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button nativeButton={false} render={<Link href="/orders" />} className="bg-[#ff5a1f] text-white">
          Xem đơn hàng
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/" />}>
          Tiếp tục mua sắm
        </Button>
      </div>
    </section>
  );
}

function stateView(
  status: PaymentStatus | undefined,
  initial: "success" | "error" | "cancel",
  loading: boolean,
) {
  if (loading || status === "pending")
    return {
      icon: <LoaderCircle className="size-8 animate-spin" />,
      iconClass: "bg-amber-50 text-amber-600",
      title: "Đang xác nhận thanh toán",
      description: "Hệ thống đang chờ thông báo chính thức từ SePay.",
    };
  if (status === "success")
    return {
      icon: <CheckCircle2 className="size-8" />,
      iconClass: "bg-emerald-50 text-emerald-600",
      title: "Thanh toán thành công",
      description: "Khoản thanh toán đã được SePay xác nhận.",
    };
  if (status === "review_required")
    return {
      icon: <AlertTriangle className="size-8" />,
      iconClass: "bg-orange-50 text-orange-600",
      title: "Giao dịch cần đối soát",
      description: "Tiền đến sau khi đơn đã đóng. Cửa hàng sẽ kiểm tra và liên hệ với bạn.",
    };
  if (status === "cancelled" || initial === "cancel")
    return {
      icon: <XCircle className="size-8" />,
      iconClass: "bg-zinc-100 text-zinc-600",
      title: "Đã hủy thanh toán",
      description: "Đơn chưa thanh toán đã được hủy và hàng giữ chỗ được hoàn lại.",
    };
  if (status === "expired")
    return {
      icon: <Clock3 className="size-8" />,
      iconClass: "bg-zinc-100 text-zinc-600",
      title: "Thanh toán đã hết hạn",
      description: "Vui lòng tạo lại đơn hàng nếu bạn vẫn muốn mua sản phẩm.",
    };
  return {
    icon: <XCircle className="size-8" />,
    iconClass: "bg-red-50 text-red-600",
    title: "Thanh toán chưa thành công",
    description: "SePay chưa hoàn tất giao dịch. Bạn có thể kiểm tra lại trong trang đơn hàng.",
  };
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <strong className="break-all text-right">{value}</strong>
    </div>
  );
}
