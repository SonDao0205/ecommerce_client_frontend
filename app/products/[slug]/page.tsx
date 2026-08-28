import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiError } from "@/src/core/api";
import { ProductDetailView } from "@/src/features/storefront/components/product-detail-view";
import { storefrontService } from "@/src/features/storefront/api/storefront.service";
import type { StorefrontProduct } from "@/src/features/products";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await storefrontService.getProductBySlug(slug);
    return {
      title: `${product.name} | ShopNow`,
      description: product.description
        ?.replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 150),
    };
  } catch {
    return { title: "Không tìm thấy sản phẩm | ShopNow" };
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  let product: StorefrontProduct;
  try {
    product = await storefrontService.getProductBySlug(slug);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) notFound();
    throw error;
  }
  const relatedData = await storefrontService.getProducts({
    category: product.category?.slug,
    limit: 5,
  });
  const related = relatedData.items
    .filter((item) => item.id !== product.id)
    .slice(0, 4);
  return <ProductDetailView product={product} related={related} />;
}
