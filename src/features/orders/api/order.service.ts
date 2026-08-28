import { BaseApiService, httpClient } from "@/src/core/api";
import type {
  BuyNowOrderPayload,
  Order,
  OrderRecipientPayload,
  OrderStatus,
  OrderSummary,
} from "../types/order";
import type { PaginatedData } from "@/src/types/api";

export class OrderService extends BaseApiService {
  constructor() {
    super(httpClient, "/orders");
  }

  createFromCart(payload: OrderRecipientPayload): Promise<Order> {
    return this.post<Order>("from-cart", payload);
  }

  buyNow(payload: BuyNowOrderPayload): Promise<Order> {
    return this.post<Order>("buy-now", payload);
  }

  getMyOrders(query: { page?: number; limit?: number; status?: OrderStatus } = {}): Promise<PaginatedData<OrderSummary>> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) params.set(key, String(value));
    });
    const suffix = params.size ? `?${params.toString()}` : "";
    return this.get<PaginatedData<OrderSummary>>(`my${suffix}`, { cache: "no-store" });
  }

  getMyOrder(id: string): Promise<Order> {
    return this.get<Order>(`my/${id}`, { cache: "no-store" });
  }
}

export const orderService = new OrderService();
