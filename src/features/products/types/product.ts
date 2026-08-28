export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sku?: string;
  unitPrice: number;
  originalPrice?: number;
  thumbnailUrl?: string;
  images?: string[];
  categoryId?: string;
  category?: {
    id: string;
    name?: string;
    slug?: string;
  };
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id?: string;
  name: string;
  value: string;
  sku?: string | null;
  unitPrice?: number | null;
  stock: number;
  children?: ProductVariant[];
}

export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
}

export interface StorefrontProduct extends Product {
  inventory: {
    stock: number;
    reservedStock: number;
    lowStockThreshold: number;
  };
}

export interface ProductVariantGroupInput {
  name: string;
  value: string;
  children: Array<{
    name: string;
    value: string;
    sku: string;
    unitPrice: number;
    stock: number;
  }>;
}

export interface ProductPayload {
  name: string;
  slug: string;
  description?: string;
  sku?: string;
  unitPrice: number;
  thumbnailUrl?: string;
  images?: string[];
  categoryId?: string;
  variants?: ProductVariantGroupInput[];
}

export type ProductImageManifestItem =
  | { kind: "existing"; url: string }
  | { kind: "new"; fileIndex: number };

export interface ProductMultipartPayload {
  product: Omit<ProductPayload, "thumbnailUrl" | "images">;
  files: File[];
  imageManifest: ProductImageManifestItem[];
  thumbnailIndex?: number;
}
