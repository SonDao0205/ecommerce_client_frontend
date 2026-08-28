"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, Heart, Minus, Plus, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/src/features/products";
import type { StorefrontProduct } from "@/src/features/products";
import { ProductCard } from "./product-card";
import { StoreBenefits, StorefrontFooter } from "./storefront-footer";
import { StorefrontHeader } from "./storefront-header";
import { useAuth, useCart } from "@/src/providers/storefront-provider";
import { ApiError } from "@/src/core/api";
import { orderService } from "@/src/features/orders/api/order.service";
import { CheckoutDialog } from "@/src/features/orders/components/checkout-dialog";
import type { OrderRecipientPayload } from "@/src/features/orders/types/order";

const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value) + "₫";
const isVideo = (url: string) => /\/video\/upload\/|\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);

export function ProductDetailView({ product, related }: { product: StorefrontProduct; related: StorefrontProduct[] }) {
  const orderIdempotencyKey = useRef(crypto.randomUUID());
  const { user } = useAuth();
  const { addItem } = useCart();
  const media = useMemo(() => Array.from(new Set([product.thumbnailUrl, ...(product.images ?? [])].filter(Boolean) as string[])), [product]);
  const [activeMedia, setActiveMedia] = useState(media[0]);
  const [selectedParent, setSelectedParent] = useState<ProductVariant | undefined>(product.variants?.[0]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(() => product.variants?.[0]?.children?.find((item) => item.stock > 0) ?? product.variants?.[0]?.children?.[0]);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const price = Number(selectedVariant?.unitPrice ?? product.unitPrice);
  const stock = selectedVariant ? selectedVariant.stock : product.inventory.stock - product.inventory.reservedStock;
  const discount = product.originalPrice ? Math.round((1 - price / product.originalPrice) * 100) : 0;

  function chooseParent(parent: ProductVariant) {
    setSelectedParent(parent);
    setSelectedVariant(parent.children?.find((item) => item.stock > 0) ?? parent.children?.[0]);
    setQuantity(1);
  }

  async function addToCart() {
    if (stock <= 0) return;
    setIsAdding(true);
    try {
      await addItem({
        productId: product.id,
        productSku: product.sku,
        variantId: selectedVariant?.id,
        variantSku: selectedVariant?.sku ?? undefined,
        quantity,
        snapshot: {
          unitPrice: price,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            thumbnailUrl: product.thumbnailUrl,
            isActive: product.isActive,
          },
          ...(selectedVariant?.id && {
            variant: {
              id: selectedVariant.id,
              name: selectedVariant.name,
              value: selectedVariant.value,
              sku: selectedVariant.sku,
              stock: selectedVariant.stock,
            },
          }),
        },
      });
      toast.success("Đã thêm vào giỏ hàng", {
        description: `${quantity} × ${product.name}${selectedParent ? ` · ${selectedParent.value}` : ""}${selectedVariant ? ` · ${selectedVariant.value}` : ""}`,
      });
    } catch (error) {
      toast.error("Không thể thêm vào giỏ hàng", {
        description: error instanceof ApiError ? error.message : "Vui lòng thử lại sau.",
      });
    } finally {
      setIsAdding(false);
    }
  }

  function openBuyNow() {
    if (!user) {
      toast.error("Bạn cần đăng nhập để mua ngay");
      return;
    }
    orderIdempotencyKey.current = crypto.randomUUID();
    setCheckoutOpen(true);
  }

  async function buyNow(recipient: OrderRecipientPayload) {
    setIsOrdering(true);
    try {
      const order = await orderService.buyNow(
        {
          ...recipient,
          productId: product.id,
          productSku: product.sku,
          variantId: selectedVariant?.id,
          variantSku: selectedVariant?.sku ?? undefined,
          quantity,
        },
        orderIdempotencyKey.current,
      );
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
      setIsOrdering(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f6f6] text-[#222]">
      <StorefrontHeader />
      <main className="mx-auto max-w-7xl px-4 py-5 lg:px-6">
        <nav className="mb-5 flex items-center gap-2 overflow-hidden text-xs text-muted-foreground">
          <Link href="/">Trang chủ</Link><ChevronRight className="size-3" /><span>{product.category?.name}</span><ChevronRight className="size-3" /><span className="truncate text-foreground">{product.name}</span>
        </nav>

        <section className="grid gap-8 rounded-2xl border bg-white p-4 md:p-6 lg:grid-cols-2">
          <div className="grid gap-3 sm:grid-cols-[76px_1fr]">
            <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">
              {media.map((url, index) => <button key={url} type="button" onClick={() => setActiveMedia(url)} className={cn("relative size-[72px] shrink-0 overflow-hidden rounded-lg border bg-zinc-50", activeMedia === url && "border-2 border-[#ff5a1f]")}>
                {isVideo(url) ? <video src={url} muted preload="metadata" className="h-full w-full object-cover" /> : <Image src={url} alt={`${product.name} ${index + 1}`} fill unoptimized loading="eager" className="object-cover" />}
              </button>)}
            </div>
            <div className="relative order-1 aspect-square overflow-hidden rounded-xl border bg-zinc-50 sm:order-2">
              {isVideo(activeMedia) ? <video src={activeMedia} controls autoPlay muted className="h-full w-full object-contain" /> : <Image src={activeMedia} alt={product.name} fill unoptimized loading="eager" className="object-contain p-4" />}
              {discount > 0 && <span className="absolute top-3 right-3 rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white">-{discount}%</span>}
            </div>
          </div>

          <div className="py-1">
            <p className="text-sm font-semibold text-[#ff5a1f]">{product.category?.name ?? "Sản phẩm"}</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight">{product.name}</h1>
            <div className="mt-7 flex flex-wrap items-center gap-3"><strong className="text-3xl text-red-600">{money(price)}</strong>{product.originalPrice && <span className="text-sm text-muted-foreground line-through">{money(product.originalPrice)}</span>}{discount > 0 && <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-red-600">Tiết kiệm {discount}%</span>}</div>
            <p className="mt-2 text-xs text-muted-foreground">Giá đã bao gồm VAT · SKU: {selectedVariant?.sku ?? product.sku}</p>

            {(product.variants?.length ?? 0) > 0 && <>
              <OptionGroup title={product.variants?.[0]?.name ?? "Biến thể"}>
                {product.variants?.map((parent) => <button key={parent.id} type="button" onClick={() => chooseParent(parent)} className={cn("rounded-lg border px-4 py-3 text-sm", selectedParent?.id === parent.id && "border-[#ff5a1f] bg-orange-50 text-[#ff5a1f]")}><span className="font-medium">{parent.value}</span><small className="mt-1 block text-[11px] text-muted-foreground">{parent.children?.length ?? 0} lựa chọn</small></button>)}
              </OptionGroup>
              <OptionGroup title={selectedParent?.children?.[0]?.name ?? "Phiên bản"}>
                {selectedParent?.children?.map((variant) => <button key={variant.id} type="button" disabled={variant.stock <= 0} onClick={() => { setSelectedVariant(variant); setQuantity(1); }} className={cn("relative min-w-28 rounded-lg border px-4 py-3 text-sm disabled:opacity-40", selectedVariant?.id === variant.id && "border-[#ff5a1f] bg-orange-50 text-[#ff5a1f]")}><span className="font-medium">{variant.value}</span><small className="mt-1 block text-[11px] text-muted-foreground">{money(Number(variant.unitPrice))}</small>{selectedVariant?.id === variant.id && <Check className="absolute top-1 right-1 size-3" />}</button>)}
              </OptionGroup>
            </>}

            <p className={cn("mt-5 text-sm font-medium", stock > 0 ? "text-green-600" : "text-red-600")}>{stock > 0 ? `Còn ${stock} sản phẩm` : "Tạm hết hàng"}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[120px_1fr_1fr]">
              <div className="grid h-12 grid-cols-3 overflow-hidden rounded-lg border"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus className="mx-auto size-4" /></button><span className="grid place-items-center border-x text-sm font-semibold">{quantity}</span><button type="button" onClick={() => setQuantity((value) => Math.min(stock, value + 1))}><Plus className="mx-auto size-4" /></button></div>
              <Button variant="outline" disabled={stock <= 0 || isAdding} onClick={() => void addToCart()} className="h-12 border-[#ff5a1f] text-[#ff5a1f]"><ShoppingCart /> {isAdding ? "Đang thêm..." : "Thêm vào giỏ"}</Button>
              <Button disabled={stock <= 0 || isOrdering} onClick={openBuyNow} className="h-12 bg-[#ff5a1f] text-white hover:bg-[#e94b13]">{isOrdering ? "Đang đặt hàng..." : "Mua ngay"}</Button>
            </div>
            <div className="mt-6 grid gap-3 rounded-xl border p-4 sm:grid-cols-3"><Service icon={Truck} title="Giao hàng miễn phí" text="Đơn từ 500.000₫" /><Service icon={ShieldCheck} title="Bảo hành chính hãng" text="Hỗ trợ toàn quốc" /><Service icon={Heart} title="Đổi trả 30 ngày" text="Nhanh chóng, dễ dàng" /></div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border bg-white p-6"><h2 className="mb-5 text-xl font-bold">Mô tả sản phẩm</h2><div className="prose max-w-none text-sm leading-7 text-zinc-700 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc" dangerouslySetInnerHTML={{ __html: product.description ?? "" }} /></section>
        <section className="mt-5 rounded-2xl border bg-white p-5"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">Sản phẩm liên quan</h2><Link href="/" className="text-sm text-[#ff5a1f]">Xem tất cả</Link></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>
        <div className="mt-5"><StoreBenefits /></div>
      </main>
      <StorefrontFooter />
      <CheckoutDialog
        open={checkoutOpen}
        pending={isOrdering}
        title="Xác nhận mua ngay"
        user={user}
        onClose={() => setCheckoutOpen(false)}
        onConfirm={buyNow}
      />
    </div>
  );
}

function OptionGroup({ title, children }: { title: string; children: React.ReactNode }) { return <div className="mt-6"><h3 className="mb-2 text-sm font-semibold">Chọn {title.toLowerCase()}</h3><div className="flex flex-wrap gap-2">{children}</div></div>; }
function Service({ icon: Icon, title, text }: { icon: typeof Truck; title: string; text: string }) { return <div className="flex gap-2"><Icon className="size-5 shrink-0 text-[#ff5a1f]" /><div><strong className="block text-xs">{title}</strong><span className="text-[11px] text-muted-foreground">{text}</span></div></div>; }
