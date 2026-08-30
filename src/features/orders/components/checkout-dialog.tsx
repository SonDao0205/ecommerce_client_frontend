"use client";

import { Check, LoaderCircle, MapPin, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/src/core/api";
import type { AuthUser } from "@/src/features/auth/types/auth";
import { customerAddressService } from "@/src/features/customer-addresses/api/customer-address.service";
import type { CustomerAddress } from "@/src/features/customer-addresses/types/customer-address";
import { useDebouncedCallback } from "@/src/hooks/use-debounced-callback";
import type { OrderRecipientPayload } from "../types/order";

interface CheckoutDialogProps {
  open: boolean;
  pending?: boolean;
  title: string;
  user?: AuthUser | null;
  onClose: () => void;
  onConfirm: (payload: OrderRecipientPayload) => Promise<boolean>;
}

export function CheckoutDialog({
  open,
  pending,
  title,
  user,
  onClose,
  onConfirm,
}: CheckoutDialogProps) {
  if (!open) return null;

  return (
    <CheckoutDialogContent
      pending={pending}
      title={title}
      user={user}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

function CheckoutDialogContent({
  pending,
  title,
  user,
  onClose,
  onConfirm,
}: Omit<CheckoutDialogProps, "open">) {
  const [recipientName, setRecipientName] = useState(user?.fullName ?? "");
  const [recipientPhone, setRecipientPhone] = useState(user?.phone ?? "");
  const [shippingAddress, setShippingAddress] = useState("");
  const [note, setNote] = useState("");
  const [savedAddress, setSavedAddress] = useState<CustomerAddress | null>(
    null,
  );
  const [saveForLater, setSaveForLater] = useState(true);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const busy = Boolean(pending || savingAddress || submitting);

  useEffect(() => {
    let cancelled = false;
    customerAddressService
      .getDefault()
      .then((address) => {
        if (cancelled || !address) return;
        setSavedAddress(address);
        setRecipientName(address.recipientName);
        setRecipientPhone(address.phone);
        setShippingAddress(address.address);
      })
      .catch(() => {
        // Không chặn đặt hàng khi hồ sơ chưa tải được.
      })
      .finally(() => {
        if (!cancelled) setLoadingAddress(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [busy, onClose]);

  const confirmOrder = useDebouncedCallback(
    async (payload: OrderRecipientPayload) => {
      try {
        const orderCreated = await onConfirm(payload);
        if (!orderCreated) return;

        const addressPayload = {
          recipientName: payload.recipientName,
          phone: payload.recipientPhone,
          email: savedAddress?.email ?? user?.email ?? undefined,
          address: payload.shippingAddress,
          isDefault: true,
        };
        if (saveForLater && hasAddressChanged(savedAddress, addressPayload)) {
          setSavingAddress(true);
          try {
            await customerAddressService.saveDefault(addressPayload);
            toast.success(
              savedAddress
                ? "Đã cập nhật hồ sơ giao hàng"
                : "Đã lưu hồ sơ giao hàng",
            );
          } catch (error) {
            toast.warning("Đơn hàng đã tạo nhưng chưa lưu được hồ sơ", {
              description:
                error instanceof ApiError
                  ? error.message
                  : "Bạn có thể lưu lại trong trang Hồ sơ.",
            });
          } finally {
            setSavingAddress(false);
          }
        }
        onClose();
      } finally {
        setSubmitting(false);
      }
    },
    400,
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const payload = {
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      shippingAddress: shippingAddress.trim(),
      note: note.trim() || undefined,
    };
    const nextErrors: Record<string, string> = {};
    if (!payload.recipientName)
      nextErrors.recipientName = "Vui lòng nhập tên người nhận.";
    if (!/^(?:\+84|0)\d{9,10}$/.test(payload.recipientPhone)) {
      nextErrors.recipientPhone = "Số điện thoại không đúng định dạng.";
    }
    if (!payload.shippingAddress)
      nextErrors.shippingAddress = "Vui lòng nhập địa chỉ nhận hàng.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    confirmOrder(payload);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#ff5a1f]">
              <MapPin className="size-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Thông tin giao hàng
              </span>
            </div>
            <h2 id="checkout-title" className="mt-2 text-xl font-bold">
              {title}
            </h2>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Đóng"
            disabled={busy}
            onClick={onClose}
          >
            <X />
          </Button>
        </div>

        <form
          className="mt-5 space-y-4"
          noValidate
          onSubmit={(event) => void submit(event)}
        >
          {loadingAddress && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <LoaderCircle className="size-3.5 animate-spin" /> Đang tải thông
              tin đã lưu...
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">
              Tên người nhận
              <Input
                maxLength={150}
                disabled={busy || loadingAddress}
                value={recipientName}
                onChange={(event) => {
                  setRecipientName(event.target.value);
                  setErrors((value) => ({ ...value, recipientName: "" }));
                }}
              />
              {errors.recipientName && (
                <span className="block text-xs font-normal text-red-600">
                  {errors.recipientName}
                </span>
              )}
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              Số điện thoại
              <Input
                maxLength={20}
                disabled={busy || loadingAddress}
                value={recipientPhone}
                onChange={(event) => {
                  setRecipientPhone(event.target.value);
                  setErrors((value) => ({ ...value, recipientPhone: "" }));
                }}
              />
              {errors.recipientPhone && (
                <span className="block text-xs font-normal text-red-600">
                  {errors.recipientPhone}
                </span>
              )}
            </label>
          </div>
          <label className="block space-y-1.5 text-sm font-medium">
            Địa chỉ nhận hàng
            <textarea
              maxLength={1000}
              disabled={busy || loadingAddress}
              value={shippingAddress}
              onChange={(event) => {
                setShippingAddress(event.target.value);
                setErrors((value) => ({ ...value, shippingAddress: "" }));
              }}
              className="min-h-24 w-full resize-y rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-[#ff5a1f] focus:ring-2 focus:ring-orange-100 disabled:opacity-50"
            />
            {errors.shippingAddress && (
              <span className="block text-xs font-normal text-red-600">
                {errors.shippingAddress}
              </span>
            )}
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            Ghi chú{" "}
            <span className="font-normal text-muted-foreground">
              (không bắt buộc)
            </span>
            <textarea
              maxLength={1000}
              disabled={busy}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-20 w-full resize-y rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-[#ff5a1f] focus:ring-2 focus:ring-orange-100 disabled:opacity-50"
            />
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-zinc-50 p-3 text-sm">
            <button
              type="button"
              role="checkbox"
              aria-checked={saveForLater}
              disabled={busy}
              onClick={() => setSaveForLater((value) => !value)}
              className={`mt-0.5 grid size-5 shrink-0 cursor-pointer place-items-center rounded border ${saveForLater ? "border-[#ff5a1f] bg-[#ff5a1f] text-white" : "bg-white"}`}
            >
              {saveForLater && <Check className="size-3.5" />}
            </button>
            <span>
              <strong className="block">Lưu thông tin cho lần mua sau</strong>
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                Tên, số điện thoại và địa chỉ này sẽ tự động điền ở lần đặt hàng
                tiếp theo.
              </span>
            </span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={busy || loadingAddress}
              className="bg-[#ff5a1f] text-white hover:bg-[#e94b13]"
            >
              {busy && <LoaderCircle className="animate-spin" />}
              {savingAddress
                ? "Đang lưu hồ sơ..."
                : pending
                  ? "Đang tạo đơn..."
                  : submitting
                    ? "Đang xác nhận..."
                    : "Xác nhận đặt hàng"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function normalizeComparable(value?: string | null): string {
  return (value ?? "").trim();
}

function hasAddressChanged(
  savedAddress: CustomerAddress | null,
  payload: {
    recipientName: string;
    phone: string;
    email?: string;
    address: string;
  },
): boolean {
  if (!savedAddress) return true;
  return (
    normalizeComparable(savedAddress.recipientName) !==
      normalizeComparable(payload.recipientName) ||
    normalizeComparable(savedAddress.phone) !==
      normalizeComparable(payload.phone) ||
    normalizeComparable(savedAddress.email).toLowerCase() !==
      normalizeComparable(payload.email).toLowerCase() ||
    normalizeComparable(savedAddress.address) !==
      normalizeComparable(payload.address)
  );
}
