import type { Metadata } from "next";
import { CartPageView } from "@/src/features/cart/components/cart-page-view";
import { StorefrontFooter } from "@/src/features/storefront/components/storefront-footer";
import { StorefrontHeader } from "@/src/features/storefront/components/storefront-header";

export const metadata: Metadata = { title: "Giỏ hàng" };

export default function CartPage() {
  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      <StorefrontHeader />
      <main className="mx-auto min-h-[65vh] max-w-7xl px-4 py-8 lg:px-6"><CartPageView /></main>
      <StorefrontFooter />
    </div>
  );
}
