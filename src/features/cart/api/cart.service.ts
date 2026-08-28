import { BaseApiService, httpClient } from "@/src/core/api";
import type { ApiCartSummary, CartRequestItem } from "../types/cart";

export class CartService extends BaseApiService {
  constructor() {
    super(httpClient, "/cart");
  }

  getCart(): Promise<ApiCartSummary> {
    return this.get<ApiCartSummary>();
  }

  addItem(item: CartRequestItem): Promise<ApiCartSummary> {
    return this.post<ApiCartSummary>("items", item);
  }

  merge(items: CartRequestItem[]): Promise<ApiCartSummary> {
    return this.post<ApiCartSummary>("merge", { items });
  }

  updateItem(itemId: string, quantity: number): Promise<ApiCartSummary> {
    return this.patch<ApiCartSummary>(`items/${itemId}`, { quantity });
  }

  removeItem(itemId: string): Promise<ApiCartSummary> {
    return this.delete<ApiCartSummary>(`items/${itemId}`);
  }

  clear(): Promise<ApiCartSummary> {
    return this.delete<ApiCartSummary>();
  }
}

export const cartService = new CartService();
