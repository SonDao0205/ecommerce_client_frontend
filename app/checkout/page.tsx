import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutPageView } from "@/src/features/orders/components/checkout-page-view";
import { StorefrontFooter } from "@/src/features/storefront/components/storefront-footer";
import { StorefrontHeader } from "@/src/features/storefront/components/storefront-header";

export const metadata: Metadata = { title: "Thanh toán" };
export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      <StorefrontHeader />
      <main className="mx-auto min-h-[65vh] max-w-7xl px-4 py-8 lg:px-6">
        <Suspense
          fallback={<div className="p-16 text-center">Đang tải...</div>}
        >
          <CheckoutPageView />
        </Suspense>
      </main>
      <StorefrontFooter />
    </div>
  );
}
