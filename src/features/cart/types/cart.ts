export interface CartRequestItem {
  productId?: string;
  productSku?: string;
  variantId?: string;
  variantSku?: string;
  quantity: number;
  snapshot?: LocalCartSnapshot;
}

export interface LocalCartSnapshot {
  unitPrice: number;
  product: CartLine["product"];
  variant?: CartLine["variant"];
}

export interface LocalCartItem extends CartRequestItem {
  key: string;
}

export interface CartLine {
  id: string;
  source: "local" | "database";
  quantity: number;
  unitPrice: number;
  product: {
    id: string;
    name?: string;
    slug?: string;
    sku?: string;
    thumbnailUrl?: string;
    isActive?: boolean;
  };
  variant?: {
    id: string;
    name: string;
    value: string;
    sku?: string | null;
    stock: number;
  };
}

export type ApiCartLine = Omit<CartLine, "source">;

export interface CartSummary {
  id?: string;
  items: CartLine[];
  totalQuantity: number;
  totalAmount: number;
}

export interface ApiCartSummary extends Omit<CartSummary, "items"> {
  items: ApiCartLine[];
  mergedCount?: number;
  skippedCount?: number;
}
