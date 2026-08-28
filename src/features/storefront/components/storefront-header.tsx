"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { Heart, LogOut, MapPinHouse, Menu, PackageSearch, Search, ShoppingBag, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, useCart } from "@/src/providers/storefront-provider";
import { toast } from "sonner";

export function StorefrontHeader({ query = "" }: { query?: string }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { totalQuantity } = useCart();

  async function handleLogout() {
    await logout();
    toast.success("Đã đăng xuất", { description: "Giỏ hàng trên thiết bị đã được làm trống." });
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    router.push(value ? `/?q=${encodeURIComponent(value)}` : "/", {
      scroll: false,
    });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-3 px-4 lg:px-6">
        <Link href="/" className="shrink-0 text-2xl font-black tracking-tight text-[#ff5a1f]">ShopNow</Link>
        <Button variant="outline" className="hidden md:inline-flex"><Menu /> Danh mục</Button>
        <form action="/" onSubmit={handleSearch} className="flex flex-1 overflow-hidden rounded-xl border-2 border-[#ff5a1f] bg-white">
          <Input name="q" defaultValue={query} placeholder="Tìm kiếm sản phẩm..." className="h-10 flex-1 rounded-none border-0 shadow-none focus-visible:ring-0" />
          <Button type="submit" className="h-10 rounded-none bg-[#ff5a1f] px-5 text-white hover:bg-[#e94b13]"><Search /> <span className="hidden sm:inline">Tìm</span></Button>
        </form>
        <nav className="hidden items-center gap-1 lg:flex">
          <Button variant="ghost" size="sm"><Heart /> Yêu thích</Button>
          <Button nativeButton={false} variant="ghost" size="sm" className="relative" render={<Link href="/cart" />}>
            <ShoppingBag /> Giỏ hàng
            {totalQuantity > 0 && <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-[#ff5a1f] px-1 text-[10px] leading-5 text-white">{totalQuantity}</span>}
          </Button>
          {user ? <>
            <Button nativeButton={false} variant="ghost" size="sm" render={<Link href="/profile" />}><MapPinHouse /> Hồ sơ</Button>
            <Button nativeButton={false} variant="ghost" size="sm" render={<Link href="/orders" />}><PackageSearch /> Đơn hàng</Button>
            <span className="max-w-28 truncate px-2 text-xs font-medium">{user.fullName ?? user.email}</span>
            <Button variant="ghost" size="icon-sm" aria-label="Đăng xuất" onClick={() => void handleLogout()}><LogOut /></Button>
          </> : (
            <Button nativeButton={false} variant="ghost" size="sm" render={<Link href="/login" />}><UserRound /> Đăng nhập</Button>
          )}
        </nav>
      </div>
      <div className="border-t">
        <nav className="mx-auto flex max-w-7xl gap-7 overflow-x-auto px-4 py-3 text-sm whitespace-nowrap lg:px-6">
          <Link href="/" className="font-semibold text-[#ff5a1f]">Trang chủ</Link>
          <Link href="/#products">Sản phẩm</Link>
          <Link href="/#products">Flash Sale</Link>
          <Link href="/#products">Sản phẩm mới</Link>
          <Link href="/#products">Bán chạy</Link>
          <Link href="/cart" className="lg:hidden">Giỏ hàng ({totalQuantity})</Link>
          {user && <Link href="/orders" className="lg:hidden">Đơn hàng của tôi</Link>}
          {user && <Link href="/profile" className="lg:hidden">Hồ sơ giao hàng</Link>}
          {!user && <Link href="/login" className="lg:hidden">Đăng nhập</Link>}
        </nav>
      </div>
    </header>
  );
}
