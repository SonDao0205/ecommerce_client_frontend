import { BaseApiService, httpClient } from "@/src/core/api";
import type { Payment } from "../types/order";

class PaymentService extends BaseApiService {
  constructor() {
    super(httpClient, "/payments");
  }

  getMyPayment(id: string): Promise<Payment> {
    return this.get(`my/${id}`, { cache: "no-store" });
  }

  cancelMyPayment(id: string): Promise<Payment> {
    return this.post(`my/${id}/cancel`);
  }
}

export const paymentService = new PaymentService();
