export interface OrderRecipientPayload {
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  note?: string;
  voucherCode?: string;
  paymentMethod?: PaymentMethod;
}

export type PaymentMethod = "cod" | "sepay_bank_transfer";
export type PaymentStatus =
  | "pending"
  | "success"
  | "failed"
  | "cancelled"
  | "expired"
  | "review_required"
  | "refunded";

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  provider: "cod" | "sepay" | "mock" | "stripe" | "vnpay";
  method: PaymentMethod | "sepay_card" | "sepay_napas";
  invoiceNumber: string;
  providerOrderId: string | null;
  transactionId: string | null;
  currency: string;
  attemptNumber: number;
  expiresAt: string | null;
  paidAt: string | null;
  failedAt: string | null;
  cancelledAt: string | null;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SepayCheckout {
  actionUrl: string;
  fields: Record<string, string>;
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
  reviewId: string | null;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipping"
  | "completed"
  | "cancelled"
  | "rejected"
  | "return_requested"
  | "returned"
  | "return_rejected";

export interface OrderReturnEvidence {
  url: string;
  publicId: string;
  resourceType: "image" | "video";
}

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
  confirmedAt: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  returnReason: string | null;
  returnEvidence: OrderReturnEvidence[];
  returnRequestedAt: string | null;
  returnReviewReason: string | null;
  returnReviewedAt: string | null;
  returnReviewedBy: string | null;
  stockRestoredAt: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  payment: Payment | null;
}

export interface Order extends Omit<OrderSummary, "itemCount"> {
  items: OrderItem[];
  checkout?: SepayCheckout | null;
}

export interface VoucherPreview {
  code: string;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
}

export interface VoucherPreviewPayload {
  code: string;
  mode: "cart" | "buy_now";
  productId?: string;
  productSku?: string;
  variantId?: string;
  variantSku?: string;
  quantity?: number;
}
