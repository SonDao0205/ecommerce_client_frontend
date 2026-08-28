import Image from "next/image";
import Link from "next/link";
import { Heart, ImageOff, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StorefrontProduct } from "@/src/features/products";

const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value) + "₫";

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const discount = product.originalPrice
    ? Math.round((1 - product.unitPrice / product.originalPrice) * 100)
    : 0;
  return (
    <article className="group overflow-hidden rounded-2xl border bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5">
      <div className="relative aspect-square overflow-hidden bg-zinc-50">
        <Link href={`/products/${product.slug}`} className="absolute inset-0 block">
          {product.thumbnailUrl ? (
            <Image src={product.thumbnailUrl} alt={product.name} fill unoptimized loading="eager" className="object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <ImageOff className="absolute inset-0 m-auto size-10 text-zinc-300" />
          )}
          {discount > 0 && <span className="absolute top-3 left-3 rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white">-{discount}%</span>}
        </Link>
        <Button type="button" size="icon-sm" variant="secondary" aria-label="Thêm vào yêu thích" className="absolute top-3 right-3 rounded-full bg-white shadow"><Heart /></Button>
      </div>
      <div className="p-4">
        <p className="mb-1 text-xs text-muted-foreground">{product.category?.name}</p>
        <Link href={`/products/${product.slug}`} className="line-clamp-2 min-h-11 text-[15px] font-semibold leading-5 hover:text-[#ff5a1f]">{product.name}</Link>
        <div className="mt-2 text-xs text-muted-foreground">SKU: {product.sku ?? "Chưa cập nhật"} · Còn {Math.max(0, product.inventory.stock - product.inventory.reservedStock)}</div>
        <div className="mt-3 flex items-end gap-2"><strong className="text-xl text-[#ff5a1f]">{money(product.unitPrice)}</strong>{product.originalPrice && <span className="text-xs text-muted-foreground line-through">{money(product.originalPrice)}</span>}</div>
        <Button nativeButton={false} variant="outline" className="mt-4 w-full border-[#ff5a1f] text-[#ff5a1f] hover:bg-[#ff5a1f] hover:text-white" render={<Link href={`/products/${product.slug}`} />}><ShoppingCart /> Xem sản phẩm</Button>
      </div>
    </article>
  );
}
