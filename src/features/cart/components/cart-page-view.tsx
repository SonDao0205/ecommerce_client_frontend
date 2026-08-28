"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/src/core/api";
import type { CartLine } from "@/src/features/cart/types/cart";
import { useAuth, useCart } from "@/src/providers/storefront-provider";
import { orderService } from "@/src/features/orders/api/order.service";
import { CheckoutDialog } from "@/src/features/orders/components/checkout-dialog";
import type { OrderRecipientPayload } from "@/src/features/orders/types/order";

const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value) + "₫";

export function CartPageView() {
  const { user } = useAuth();
  const { items, totalAmount, totalQuantity, isLoading, updateItem, removeItem, clearCart, resetCart } = useCart();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ordering, setOrdering] = useState(false);

  async function run(item: CartLine, action: () => Promise<void>) {
    setBusyId(item.id);
    try {
      await action();
    } catch (error) {
      toast.error("Không thể cập nhật giỏ hàng", {
        description: error instanceof ApiError ? error.message : "Vui lòng thử lại sau.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleClear() {
    try {
      await clearCart();
      toast.success("Đã làm trống giỏ hàng");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Không thể xóa giỏ hàng.");
    }
  }

  function openCheckout() {
    if (!user) {
      toast.error("Bạn cần đăng nhập để đặt hàng");
      return;
    }
    setCheckoutOpen(true);
  }

  async function createOrder(payload: OrderRecipientPayload) {
    setOrdering(true);
    try {
      const order = await orderService.createFromCart(payload);
      resetCart();
      toast.success("Đặt hàng thành công", {
        description: `Mã đơn hàng: ${order.orderCode}`,
      });
      return true;
    } catch (error) {
      toast.error("Không thể tạo đơn hàng", {
        description: error instanceof ApiError ? error.message : "Vui lòng thử lại sau.",
      });
      return false;
    } finally {
      setOrdering(false);
    }
  }

  if (isLoading) return <div className="rounded-2xl border bg-white p-16 text-center text-muted-foreground">Đang tải giỏ hàng...</div>;

  if (items.length === 0) {
    return <div className="rounded-2xl border bg-white p-16 text-center"><ShoppingBag className="mx-auto size-14 text-zinc-300" /><h1 className="mt-5 text-2xl font-bold">Giỏ hàng đang trống</h1><p className="mt-2 text-sm text-muted-foreground">Hãy chọn sản phẩm bạn yêu thích để bắt đầu mua sắm.</p><Button nativeButton={false} className="mt-6 bg-[#ff5a1f] text-white" render={<Link href="/#products" />}>Tiếp tục mua sắm</Button></div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="overflow-hidden rounded-2xl border bg-white">
        <div className="flex items-center justify-between border-b px-5 py-4"><div><h1 className="text-xl font-bold">Giỏ hàng của bạn</h1><p className="mt-1 text-xs text-muted-foreground">{user ? "Đang lưu trong tài khoản" : "Đang lưu trên thiết bị này"}</p></div><Button variant="ghost" size="sm" onClick={() => void handleClear()} className="text-red-600"><Trash2 /> Xóa tất cả</Button></div>
        <div className="divide-y">
          {items.map((item) => <CartItemRow key={item.id} item={item} busy={busyId === item.id} onUpdate={(quantity) => run(item, () => updateItem(item, quantity))} onRemove={() => run(item, () => removeItem(item))} />)}
        </div>
      </section>
      <aside className="h-fit rounded-2xl border bg-white p-5 lg:sticky lg:top-32">
        <h2 className="text-lg font-bold">Tóm tắt đơn hàng</h2>
        <div className="mt-5 space-y-3 border-b pb-5 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Sản phẩm</span><span>{totalQuantity}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Phí vận chuyển</span><span className="text-green-600">Miễn phí</span></div></div>
        <div className="flex items-end justify-between py-5"><strong>Tổng cộng</strong><strong className="text-2xl text-[#ff5a1f]">{money(totalAmount)}</strong></div>
        <Button disabled={ordering} onClick={openCheckout} className="h-11 w-full bg-[#ff5a1f] text-white hover:bg-[#e94b13]">Tiến hành thanh toán</Button>
        {!user && <p className="mt-3 text-center text-xs text-muted-foreground"><Link href="/login" className="font-semibold text-[#ff5a1f]">Đăng nhập</Link> để lưu giỏ hàng vào tài khoản.</p>}
      </aside>
      <CheckoutDialog
        open={checkoutOpen}
        pending={ordering}
        title="Xác nhận đơn hàng từ giỏ hàng"
        user={user}
        onClose={() => setCheckoutOpen(false)}
        onConfirm={createOrder}
      />
    </div>
  );
}

function CartItemRow({ item, busy, onUpdate, onRemove }: { item: CartLine; busy: boolean; onUpdate: (quantity: number) => Promise<void>; onRemove: () => Promise<void> }) {
  return <div className="grid gap-4 p-5 sm:grid-cols-[96px_1fr_auto] sm:items-center"><Link href={`/products/${item.product.slug}`} className="relative aspect-square overflow-hidden rounded-xl bg-zinc-50">{item.product.thumbnailUrl ? <Image src={item.product.thumbnailUrl} alt={item.product.name ?? "Sản phẩm"} fill unoptimized loading="eager" className="object-cover" /> : <ShoppingBag className="absolute inset-0 m-auto text-zinc-300" />}</Link><div><Link href={`/products/${item.product.slug}`} className="font-semibold hover:text-[#ff5a1f]">{item.product.name}</Link>{item.variant && <p className="mt-1 text-xs text-muted-foreground">{item.variant.name}: {item.variant.value} · SKU: {item.variant.sku}</p>}<strong className="mt-3 block text-[#ff5a1f]">{money(item.unitPrice)}</strong></div><div className="flex items-center gap-3 sm:flex-col sm:items-end"><div className="grid h-9 grid-cols-3 overflow-hidden rounded-lg border"><button disabled={busy || item.quantity <= 1} type="button" onClick={() => void onUpdate(item.quantity - 1)} className="w-9 disabled:opacity-40"><Minus className="mx-auto size-3.5" /></button><span className="grid w-10 place-items-center border-x text-sm font-medium">{item.quantity}</span><button disabled={busy} type="button" onClick={() => void onUpdate(item.quantity + 1)} className="w-9 disabled:opacity-40"><Plus className="mx-auto size-3.5" /></button></div><Button disabled={busy} variant="ghost" size="sm" onClick={() => void onRemove()} className="text-red-600"><Trash2 /> Xóa</Button></div></div>;
}
