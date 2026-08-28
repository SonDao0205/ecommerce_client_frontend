export interface OrderRecipientPayload {
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  note?: string;
}

export interface BuyNowOrderPayload extends OrderRecipientPayload {
  productId?: string;
  productSku?: string;
  variantId?: string;
  variantSku?: string;
  quantity: number;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  variantValue: string | null;
  variantSku: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipping"
  | "completed"
  | "cancelled"
  | "rejected";

export interface OrderSummary {
  id: string;
  orderCode: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: string;
  recipientName: string;
  recipientPhone: string;
  note: string | null;
  rejectionReason: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
}

export interface Order extends Omit<OrderSummary, "itemCount"> {
  items: OrderItem[];
}
