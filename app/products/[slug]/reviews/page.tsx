import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AllProductReviews } from "@/src/features/reviews/components/review-list";
import { StorefrontFooter } from "@/src/features/storefront/components/storefront-footer";
import { StorefrontHeader } from "@/src/features/storefront/components/storefront-header";
export const metadata: Metadata = { title: "Đánh giá sản phẩm" };
export default async function ProductReviewsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      <StorefrontHeader />
      <main className="mx-auto min-h-[65vh] max-w-4xl px-4 py-8">
        <Link
          href={`/products/${encodeURIComponent(slug)}`}
          className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-[#ff5a1f]"
        >
          <ChevronLeft className="size-4" /> Quay lại sản phẩm
        </Link>
        <section className="rounded-2xl border bg-white p-5 sm:p-7">
          <AllProductReviews slug={slug} />
        </section>
      </main>
      <StorefrontFooter />
    </div>
  );
}
