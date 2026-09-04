"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Check,
  Banknote,
  Landmark,
  LoaderCircle,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/src/core/api";
import type { CartLine } from "@/src/features/cart/types/cart";
import { useDebouncedCartQuantity } from "@/src/features/cart/hooks/use-debounced-cart-quantity";
import { customerAddressService } from "@/src/features/customer-addresses/api/customer-address.service";
import type { CustomerAddress } from "@/src/features/customer-addresses/types/customer-address";
import {
  checkoutIntentStorage,
  type BuyNowCheckoutIntent,
} from "@/src/features/orders/checkout-intent";
import { orderService } from "@/src/features/orders/api/order.service";
import type {
  OrderRecipientPayload,
  PaymentMethod,
  SepayCheckout,
  VoucherPreview,
} from "@/src/features/orders/types/order";
import { useDebouncedCallback } from "@/src/hooks/use-debounced-callback";
import { useAuth, useCart } from "@/src/providers/storefront-provider";

const money = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(Number(value)) + "₫";

export function CheckoutPageView() {
  const mode = useSearchParams().get("mode") === "buy-now" ? "buy-now" : "cart";
  const router = useRouter();
  const idempotencyKey = useRef(crypto.randomUUID());
  const voucherLock = useRef(false);
  const submitLock = useRef(false);
  const { user, isLoading: authLoading } = useAuth();
  const {
    items: cartItems,
    isLoading: cartLoading,
    resetCart,
    updateItem,
  } = useCart();
  const [intent, setIntent] = useState<BuyNowCheckoutIntent | null>(null);
  const [intentLoaded, setIntentLoaded] = useState(mode !== "buy-now");
  const [recipientName, setRecipientName] = useState(user?.fullName ?? "");
  const [recipientPhone, setRecipientPhone] = useState(user?.phone ?? "");
  const [shippingAddress, setShippingAddress] = useState("");
  const [note, setNote] = useState("");
  const [savedAddress, setSavedAddress] = useState<CustomerAddress | null>(
    null,
  );
  const [saveForLater, setSaveForLater] = useState(true);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cod");
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucher, setVoucher] = useState<VoucherPreview | null>(null);
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [voucherQueued, setVoucherQueued] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const cartQuantities = useDebouncedCartQuantity(updateItem, (error) => {
    toast.error("Không thể cập nhật số lượng", {
      description:
        error instanceof ApiError ? error.message : "Vui lòng thử lại sau.",
    });
  });

  useEffect(() => {
    if (mode === "buy-now")
      queueMicrotask(() => {
        setIntent(checkoutIntentStorage.get());
        setIntentLoaded(true);
      });
  }, [mode]);
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Bạn cần đăng nhập để thanh toán");
      router.replace("/login");
    }
  }, [authLoading, router, user]);
  useEffect(() => {
    if (!user) return;
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
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoadingAddress(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const lines = useMemo(
    () =>
      mode === "cart"
        ? cartItems.map((item) => ({
            ...item,
            quantity: cartQuantities.quantityFor(item),
          }))
        : intent
          ? [intentToLine(intent)]
          : [],
    [cartItems, cartQuantities, intent, mode],
  );
  const subtotal = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const effectiveVoucher =
    voucher?.code === voucherCode.trim().toUpperCase() ? voucher : null;
  const busy = submitting;

  const applyVoucher = useDebouncedCallback(async (code: string) => {
    if (!code) {
      setVoucher(null);
      toast.error("Vui lòng nhập mã giảm giá");
      return;
    }
    setApplyingVoucher(true);
    try {
      if (mode === "cart") await cartQuantities.flush();
      const preview = await orderService.previewVoucher({
        code,
        mode: mode === "cart" ? "cart" : "buy_now",
        ...(intent && {
          productId: intent.productId,
          productSku: intent.productSku,
          variantId: intent.variantId,
          variantSku: intent.variantSku,
          quantity: intent.quantity,
        }),
      });
      setVoucher(preview);
      setVoucherCode(preview.code);
      toast.success("Áp dụng mã giảm giá thành công", {
        description: `Bạn được giảm ${money(preview.discountAmount)}.`,
      });
    } catch (error) {
      setVoucher(null);
      toast.error("Không thể áp dụng mã giảm giá", {
        description:
          error instanceof ApiError ? error.message : "Vui lòng thử lại sau.",
      });
    } finally {
      voucherLock.current = false;
      setApplyingVoucher(false);
      setVoucherQueued(false);
    }
  }, 400);

  function addressPayload() {
    return {
      recipientName: recipientName.trim(),
      phone: recipientPhone.trim(),
      email: savedAddress?.email ?? user?.email ?? undefined,
      address: shippingAddress.trim(),
      isDefault: true,
    };
  }

  async function changeQuantity(line: CartLine, nextQuantity: number) {
    const maximum = mode === "buy-now" ? (intent?.maxQuantity ?? 99) : 99;
    const normalized = Math.max(1, Math.min(maximum, nextQuantity));
    if (normalized === line.quantity) return;
    setVoucher(null);
    if (mode === "cart") {
      cartQuantities.changeQuantity(line, normalized);
    } else if (intent) {
      const updated = { ...intent, quantity: normalized };
      setIntent(updated);
      checkoutIntentStorage.save(updated);
    }
  }

  const confirmOrder = useDebouncedCallback(
    async (payload: OrderRecipientPayload) => {
      try {
        if (mode === "cart") await cartQuantities.flush();
        const order =
          mode === "cart"
            ? await orderService.createFromCart(payload, idempotencyKey.current)
            : await orderService.buyNow(
                {
                  ...payload,
                  productId: intent!.productId,
                  productSku: intent!.productSku,
                  variantId: intent!.variantId,
                  variantSku: intent!.variantSku,
                  quantity: intent!.quantity,
                },
                idempotencyKey.current,
              );
        if (saveForLater && hasAddressChanged(savedAddress, addressPayload())) {
          try {
            await customerAddressService.saveDefault(addressPayload());
            toast.success(
              savedAddress
                ? "Đã tự động cập nhật thông tin giao hàng"
                : "Đã tự động lưu thông tin giao hàng",
            );
          } catch (error) {
            toast.warning("Đơn hàng đã tạo nhưng chưa lưu được hồ sơ", {
              description:
                error instanceof ApiError
                  ? error.message
                  : "Bạn có thể lưu lại trong trang Hồ sơ.",
            });
          }
        }
        if (mode === "cart") resetCart();
        else checkoutIntentStorage.clear();
        if (order.checkout) {
          toast.success("Đã tạo đơn hàng", {
            description: "Đang chuyển đến cổng thanh toán SePay...",
          });
          submitSepayCheckout(order.checkout);
          return;
        }
        toast.success("Đặt hàng thành công", {
          description: `Mã đơn hàng: ${order.orderCode}`,
        });
        router.replace(
          `/orders?created=${encodeURIComponent(order.orderCode)}`,
        );
      } catch (error) {
        toast.error("Không thể tạo đơn hàng", {
          description:
            error instanceof ApiError ? error.message : "Vui lòng thử lại sau.",
        });
      } finally {
        submitLock.current = false;
        setSubmitting(false);
      }
    },
    400,
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || applyingVoucher || voucherQueued || submitLock.current) return;
    const payload: OrderRecipientPayload = {
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      shippingAddress: shippingAddress.trim(),
      note: note.trim() || undefined,
      ...(effectiveVoucher && { voucherCode: effectiveVoucher.code }),
      paymentMethod,
    };
    const next: Record<string, string> = {};
    if (!payload.recipientName)
      next.recipientName = "Vui lòng nhập tên người nhận.";
    if (!/^(?:\+84|0)\d{9,10}$/.test(payload.recipientPhone))
      next.recipientPhone = "Số điện thoại không đúng định dạng.";
    if (!payload.shippingAddress)
      next.shippingAddress = "Vui lòng nhập địa chỉ nhận hàng.";
    setErrors(next);
    if (Object.keys(next).length) return;
    submitLock.current = true;
    setSubmitting(true);
    confirmOrder(payload);
  }

  if (authLoading || cartLoading || !intentLoaded) return <Loading />;
  if (!lines.length) return <Empty mode={mode} />;

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <section className="overflow-hidden rounded-2xl border bg-white">
        <div className="border-b px-5 py-4">
          <h1 className="text-xl font-bold">Sản phẩm trong đơn hàng</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Kiểm tra sản phẩm và biến thể trước khi xác nhận.
          </p>
        </div>
        <div className="divide-y">
          {lines.map((line) => (
            <CheckoutLine
              key={line.id}
              line={line}
              busy={busy || applyingVoucher || voucherQueued}
              maxQuantity={
                mode === "buy-now" ? (intent?.maxQuantity ?? 99) : 99
              }
              onChangeQuantity={(quantity) => changeQuantity(line, quantity)}
            />
          ))}
        </div>
      </section>
      <form
        noValidate
        onSubmit={(event) => void submit(event)}
        className="rounded-2xl border bg-white p-5 lg:sticky lg:top-24"
      >
        <div className="flex items-center gap-2 text-[#ff5a1f]">
          <MapPin className="size-5" />
          <h2 className="text-lg font-bold text-zinc-900">
            Thông tin giao hàng
          </h2>
        </div>
        {loadingAddress && (
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin" /> Đang tải thông
            tin đã lưu...
          </p>
        )}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Tên người nhận" error={errors.recipientName}>
            <Input
              maxLength={150}
              disabled={busy || loadingAddress}
              value={recipientName}
              onChange={(e) => {
                setRecipientName(e.target.value);
                setErrors((v) => ({ ...v, recipientName: "" }));
              }}
            />
          </Field>
          <Field label="Số điện thoại" error={errors.recipientPhone}>
            <Input
              maxLength={20}
              disabled={busy || loadingAddress}
              value={recipientPhone}
              onChange={(e) => {
                setRecipientPhone(e.target.value);
                setErrors((v) => ({ ...v, recipientPhone: "" }));
              }}
            />
          </Field>
        </div>
        <Field
          label="Địa chỉ nhận hàng"
          error={errors.shippingAddress}
          className="mt-4"
        >
          <textarea
            maxLength={1000}
            disabled={busy || loadingAddress}
            value={shippingAddress}
            onChange={(e) => {
              setShippingAddress(e.target.value);
              setErrors((v) => ({ ...v, shippingAddress: "" }));
            }}
            className="min-h-24 w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#ff5a1f]"
          />
        </Field>
        <Field label="Ghi chú (không bắt buộc)" className="mt-4">
          <textarea
            maxLength={1000}
            disabled={busy}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-20 w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#ff5a1f]"
          />
        </Field>
        <div className="mt-3">
          <label className="flex items-center gap-2 text-xs">
            <button
              type="button"
              role="checkbox"
              aria-checked={saveForLater}
              disabled={busy}
              onClick={() => setSaveForLater((v) => !v)}
              className={`grid size-5 place-items-center rounded border ${saveForLater ? "border-[#ff5a1f] bg-[#ff5a1f] text-white" : "bg-white"}`}
            >
              {saveForLater && <Check className="size-3" />}
            </button>
            <span>
              <strong className="block">Lưu thông tin cho lần mua sau</strong>
              <span className="text-muted-foreground">
                Chỉ tự động cập nhật khi thông tin giao hàng có thay đổi.
              </span>
            </span>
          </label>
        </div>
        <div className="mt-5 border-t pt-5">
          <p className="text-sm font-semibold">Phương thức thanh toán</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <PaymentChoice
              active={paymentMethod === "cod"}
              icon={<Banknote className="size-5" />}
              title="Thanh toán khi nhận hàng"
              description="Thanh toán cho nhân viên giao hàng"
              disabled={busy}
              onClick={() => setPaymentMethod("cod")}
            />
            <PaymentChoice
              active={paymentMethod === "sepay_bank_transfer"}
              icon={<Landmark className="size-5" />}
              title="SePay · VietQR"
              description="Quét QR và thanh toán trực tuyến"
              disabled={busy}
              onClick={() => setPaymentMethod("sepay_bank_transfer")}
            />
          </div>
        </div>
        <div className="mt-5 border-t pt-5">
          <label className="text-sm font-semibold">Mã giảm giá</label>
          <div className="mt-2 flex gap-2">
            <Input
              value={voucherCode}
              onChange={(e) => {
                setVoucherCode(e.target.value.toUpperCase());
                setVoucher(null);
              }}
              placeholder="Nhập mã voucher"
              className="uppercase"
            />
            <Button
              type="button"
              variant="outline"
              disabled={applyingVoucher || voucherQueued || !voucherCode.trim()}
              onClick={() => {
                if (applyingVoucher || voucherQueued || voucherLock.current)
                  return;
                voucherLock.current = true;
                setVoucherQueued(true);
                applyVoucher(voucherCode.trim().toUpperCase());
              }}
            >
              {applyingVoucher || voucherQueued ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Tag />
              )}
              Áp dụng
            </Button>
          </div>
          {effectiveVoucher && (
            <p className="mt-2 text-xs font-medium text-emerald-600">
              Đã áp dụng {effectiveVoucher.code} · giảm{" "}
              {money(effectiveVoucher.discountAmount)}
            </p>
          )}
        </div>
        <div className="mt-5 space-y-3 border-t pt-5 text-sm">
          <PriceRow
            label="Tổng tiền hàng"
            value={money(effectiveVoucher?.subtotalAmount ?? subtotal)}
          />
          {effectiveVoucher && (
            <>
              <PriceRow
                label="Số tiền được giảm"
                value={`-${money(effectiveVoucher.discountAmount)}`}
                valueClass="text-emerald-600"
              />
              <PriceRow
                label="Tổng tiền mới"
                value={money(effectiveVoucher.totalAmount)}
                strong
              />
            </>
          )}{" "}
          {!effectiveVoucher && (
            <PriceRow label="Tổng thanh toán" value={money(subtotal)} strong />
          )}
        </div>
        <Button
          type="submit"
          disabled={busy || loadingAddress || applyingVoucher || voucherQueued}
          className="mt-5 h-11 w-full bg-[#ff5a1f] text-white hover:bg-[#e94b13]"
        >
          {submitting && <LoaderCircle className="animate-spin" />}
          {submitting
            ? "Đang tạo đơn..."
            : paymentMethod === "sepay_bank_transfer"
              ? "Thanh toán qua SePay"
              : "Xác nhận đặt hàng"}
        </Button>
      </form>
    </div>
  );
}

function PaymentChoice({
  active,
  icon,
  title,
  description,
  disabled,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition ${active ? "border-[#ff5a1f] bg-orange-50" : "hover:bg-zinc-50"}`}
    >
      <span className={active ? "text-[#ff5a1f]" : "text-zinc-500"}>
        {icon}
      </span>
      <span>
        <strong className="block text-sm">{title}</strong>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}

function submitSepayCheckout(checkout: SepayCheckout) {
  const target = new URL(checkout.actionUrl);
  if (!new Set(["pay.sepay.vn", "pay-sandbox.sepay.vn"]).has(target.hostname)) {
    throw new Error("Địa chỉ thanh toán SePay không hợp lệ");
  }
  const form = document.createElement("form");
  form.method = "POST";
  form.action = target.toString();
  Object.entries(checkout.fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

function intentToLine(intent: BuyNowCheckoutIntent): CartLine {
  return {
    id: intent.variantId ?? intent.productId,
    source: "local",
    quantity: intent.quantity,
    unitPrice: intent.unitPrice,
    product: {
      id: intent.productId,
      name: intent.productName,
      slug: intent.productSlug,
      thumbnailUrl: intent.thumbnailUrl,
    },
    ...(intent.variantId && {
      variant: {
        id: intent.variantId,
        name: intent.variantName ?? "Biến thể",
        value: intent.variantValue ?? "",
        sku: intent.variantSku,
        stock: intent.quantity,
      },
    }),
  };
}
function CheckoutLine({
  line,
  busy,
  maxQuantity,
  onChangeQuantity,
}: {
  line: CartLine;
  busy: boolean;
  maxQuantity: number;
  onChangeQuantity: (quantity: number) => Promise<void>;
}) {
  return (
    <div className="grid gap-4 p-5 sm:grid-cols-[96px_1fr_auto] sm:items-center">
      <Link
        href={`/products/${line.product.slug}`}
        className="relative aspect-square overflow-hidden rounded-xl bg-zinc-50"
      >
        {line.product.thumbnailUrl ? (
          <Image
            src={line.product.thumbnailUrl}
            alt={line.product.name ?? "Sản phẩm"}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <ShoppingBag className="absolute inset-0 m-auto text-zinc-300" />
        )}
      </Link>
      <div>
        <Link
          href={`/products/${line.product.slug}`}
          className="font-semibold hover:text-[#ff5a1f]"
        >
          {line.product.name}
        </Link>
        {line.variant && (
          <p className="mt-1 text-xs text-muted-foreground">
            {line.variant.name}: {line.variant.value}
            {line.variant.sku ? ` · SKU: ${line.variant.sku}` : ""}
          </p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          Đơn giá: {money(line.unitPrice)}
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <div className="grid h-9 grid-cols-3 overflow-hidden rounded-lg border">
          <button
            type="button"
            disabled={busy || line.quantity <= 1}
            onClick={() => void onChangeQuantity(line.quantity - 1)}
            className="w-9 disabled:opacity-40"
            aria-label="Giảm số lượng"
          >
            <Minus className="mx-auto size-3.5" />
          </button>
          <span className="grid w-10 place-items-center border-x text-sm font-medium">
            {busy ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              line.quantity
            )}
          </span>
          <button
            type="button"
            disabled={busy || line.quantity >= maxQuantity}
            onClick={() => void onChangeQuantity(line.quantity + 1)}
            className="w-9 disabled:opacity-40"
            aria-label="Tăng số lượng"
          >
            <Plus className="mx-auto size-3.5" />
          </button>
        </div>
        <strong className="text-[#ff5a1f]">
          {money(line.unitPrice * line.quantity)}
        </strong>
      </div>
    </div>
  );
}
function Field({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block space-y-1.5 text-sm font-medium ${className}`}>
      {label}
      {children}
      {error && (
        <span className="block text-xs font-normal text-red-600">{error}</span>
      )}
    </label>
  );
}
function PriceRow({
  label,
  value,
  strong,
  valueClass = "",
}: {
  label: string;
  value: string;
  strong?: boolean;
  valueClass?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between ${strong ? "text-lg font-bold" : ""}`}
    >
      <span>{label}</span>
      <span
        className={`${strong ? "text-xl text-[#ff5a1f]" : ""} ${valueClass}`}
      >
        {value}
      </span>
    </div>
  );
}
function Loading() {
  return (
    <div className="rounded-2xl border bg-white p-16 text-center text-muted-foreground">
      <LoaderCircle className="mx-auto mb-3 animate-spin" />
      Đang chuẩn bị thanh toán...
    </div>
  );
}
function Empty({ mode }: { mode: "cart" | "buy-now" }) {
  return (
    <div className="rounded-2xl border bg-white p-16 text-center">
      <ShoppingBag className="mx-auto size-12 text-zinc-300" />
      <h1 className="mt-4 text-xl font-bold">
        Không có sản phẩm để thanh toán
      </h1>
      <Button
        nativeButton={false}
        render={<Link href={mode === "cart" ? "/cart" : "/"} />}
        className="mt-5 bg-[#ff5a1f] text-white"
      >
        Quay lại mua sắm
      </Button>
    </div>
  );
}
function normalize(value?: string | null) {
  return (value ?? "").trim();
}
function hasAddressChanged(
  saved: CustomerAddress | null,
  payload: {
    recipientName: string;
    phone: string;
    email?: string;
    address: string;
  },
) {
  return (
    !saved ||
    normalize(saved.recipientName) !== normalize(payload.recipientName) ||
    normalize(saved.phone) !== normalize(payload.phone) ||
    normalize(saved.email).toLowerCase() !==
      normalize(payload.email).toLowerCase() ||
    normalize(saved.address) !== normalize(payload.address)
  );
}
