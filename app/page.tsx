import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Headphones,
  Laptop,
  Smartphone,
  Watch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/src/features/storefront/components/product-card";
import {
  StoreBenefits,
  StorefrontFooter,
} from "@/src/features/storefront/components/storefront-footer";
import { StorefrontHeader } from "@/src/features/storefront/components/storefront-header";
import { SmoothProductSection } from "@/src/features/storefront/components/smooth-product-section";
import { storefrontService } from "@/src/features/storefront/api/storefront.service";
import type { StoreCategory, StorefrontProduct } from "@/src/features/products";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const categorySlug =
    typeof params.category === "string" ? params.category.trim() : "";

  let products: StorefrontProduct[] = [];
  let categories: StoreCategory[] = [];
  let totalItems = 0;
  let loadError = false;
  try {
    const [productData, categoryData] = await Promise.all([
      storefrontService.getProducts({
        search: query,
        category: categorySlug,
        limit: 100,
      }),
      storefrontService.getCategories(),
    ]);
    products = productData.items;
    totalItems = productData.meta.totalItems;
    categories = categoryData;
  } catch {
    loadError = true;
  }

  const rootCategories = categories.filter((item) => !item.parentId);
  const selectedCategory = categories.find(
    (item) => item.slug === categorySlug,
  );
  const quickCategories = [
    [Smartphone, "Điện thoại", "dien-thoai"],
    [Laptop, "Laptop", "laptop"],
    [Headphones, "Âm thanh", "am-thanh"],
    [Watch, "Thiết bị đeo", "thiet-bi-deo"],
  ] as const;

  const categoryHref = (slug: string) => {
    const nextParams = new URLSearchParams();
    nextParams.set("category", slug);
    if (query) nextParams.set("q", query);
    return `/?${nextParams.toString()}`;
  };

  return (
    <div className="min-h-screen bg-[#f6f6f6] text-[#222]">
      <StorefrontHeader query={query} />
      <main className="mx-auto max-w-7xl space-y-10 px-4 py-6 lg:px-6">
        <section className="grid gap-5 lg:grid-cols-[250px_1fr]">
          <aside className="hidden max-h-[520px] overflow-y-auto rounded-2xl border bg-white lg:block">
            <h2 className="sticky top-0 z-10 border-b bg-white px-5 py-4 font-bold">
              Danh mục sản phẩm
            </h2>
            {rootCategories.map((root) => (
              <div key={root.id} className="border-b py-2 last:border-0">
                <Link
                  href={categoryHref(root.slug)}
                  scroll={false}
                  className="block cursor-pointer px-5 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-[#ff5a1f]"
                >
                  {root.name}
                </Link>
                {categories
                  .filter((item) => item.parentId === root.id)
                  .map((child) => (
                    <Link
                      key={child.id}
                      href={categoryHref(child.slug)}
                      scroll={false}
                      className="flex cursor-pointer items-center justify-between px-5 py-2.5 text-sm hover:bg-orange-50 hover:text-[#ff5a1f]"
                    >
                      {child.name}
                      <ChevronRight className="size-4" />
                    </Link>
                  ))}
              </div>
            ))}
          </aside>
          <div className="relative flex min-h-[360px] items-center overflow-hidden rounded-3xl bg-gradient-to-br from-[#fff0e9] via-[#ffd8c8] to-[#ffb99f] px-7 py-10 sm:px-12">
            <div className="relative z-10 max-w-xl">
              <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-[#ff5a1f]">
                SẢN PHẨM ĐANG KINH DOANH
              </span>
              <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
                Khám phá sản phẩm.
                <br />
                <span className="text-[#ff5a1f]">Dữ liệu thật từ cửa hàng.</span>
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-zinc-600 sm:text-base">
                Tìm kiếm và lọc sản phẩm đang hoạt động trực tiếp từ hệ thống
                quản trị ShopNow.
              </p>
              <Button
                nativeButton={false}
                className="mt-6 cursor-pointer bg-[#ff5a1f] text-white hover:bg-[#e94b13]"
                render={<Link href="#products" />}
              >
                Khám phá ngay <ArrowRight />
              </Button>
            </div>
            <div className="absolute -right-16 -bottom-20 size-80 rounded-full bg-white/35" />
            <div className="absolute top-10 right-24 size-32 rounded-full border-[24px] border-white/25" />
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#ff5a1f]">
                Khám phá nhanh
              </p>
              <h2 className="mt-1 text-2xl font-bold">Danh mục nổi bật</h2>
            </div>
            <Link href="/#products" className="cursor-pointer text-sm text-[#ff5a1f]">
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickCategories.map(([Icon, name, slug]) => (
              <Link
                key={slug}
                href={categoryHref(slug)}
                scroll={false}
                className="group flex cursor-pointer items-center gap-4 rounded-2xl border bg-white p-5 transition hover:-translate-y-1 hover:border-[#ff5a1f]"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-orange-50 text-[#ff5a1f]">
                  <Icon />
                </div>
                <strong className="text-sm group-hover:text-[#ff5a1f]">
                  {name}
                </strong>
              </Link>
            ))}
          </div>
        </section>

        <SmoothProductSection
          navigationKey={`${query}:${categorySlug}`}
          shouldScroll={Boolean(query || categorySlug)}
        >
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#ff5a1f]">
                Dành cho bạn
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {query
                  ? `Kết quả cho “${query}”`
                  : selectedCategory
                    ? selectedCategory.name
                    : "Tất cả sản phẩm"}
              </h2>
              {(query || selectedCategory) && (
                <Link
                  href="/"
                  scroll={false}
                  className="mt-2 inline-block cursor-pointer text-sm text-[#ff5a1f] hover:underline"
                >
                  Xóa bộ lọc
                </Link>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {totalItems} sản phẩm
            </span>
          </div>

          {loadError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-12 text-center text-red-700">
              Không thể kết nối tới API cửa hàng. Hãy kiểm tra backend đang chạy ở
              cổng đã cấu hình.
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border bg-white p-12 text-center text-muted-foreground">
              Không tìm thấy sản phẩm phù hợp.
            </div>
          )}
        </SmoothProductSection>
        <StoreBenefits />
      </main>
      <StorefrontFooter />
    </div>
  );
}
