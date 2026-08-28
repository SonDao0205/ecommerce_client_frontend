import { BaseApiService, httpClient } from "@/src/core/api";
import type { StoreCategory, StorefrontProduct } from "@/src/features/products";
import type { PaginatedData } from "@/src/types/api";

export interface StorefrontProductFilters {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export class StorefrontService extends BaseApiService {
  constructor() {
    super(httpClient, "/storefront");
  }

  getProducts(
    filters: StorefrontProductFilters = {},
  ): Promise<PaginatedData<StorefrontProduct>> {
    const query = new URLSearchParams();
    if (filters.search) query.set("search", filters.search);
    if (filters.category) query.set("category", filters.category);
    query.set("page", String(filters.page ?? 1));
    query.set("limit", String(filters.limit ?? 24));
    return this.get<PaginatedData<StorefrontProduct>>(
      `products?${query.toString()}`,
      { skipAuth: true, cache: "no-store" },
    );
  }

  getProductBySlug(slug: string): Promise<StorefrontProduct> {
    return this.get<StorefrontProduct>(`products/${encodeURIComponent(slug)}`, {
      skipAuth: true,
      cache: "no-store",
    });
  }

  getCategories(): Promise<StoreCategory[]> {
    return this.get<StoreCategory[]>("categories", {
      skipAuth: true,
      cache: "no-store",
    });
  }
}

export const storefrontService = new StorefrontService();
