export interface BuyNowCheckoutIntent {
  productId: string;
  productSku?: string;
  variantId?: string;
  variantSku?: string;
  quantity: number;
  maxQuantity: number;
  unitPrice: number;
  productName: string;
  productSlug: string;
  thumbnailUrl?: string;
  variantName?: string;
  variantValue?: string;
}

const KEY = "shopnow_buy_now_checkout";
export const checkoutIntentStorage = {
  save(intent: BuyNowCheckoutIntent) {
    window.sessionStorage.setItem(KEY, JSON.stringify(intent));
  },
  get(): BuyNowCheckoutIntent | null {
    try {
      const value = JSON.parse(
        window.sessionStorage.getItem(KEY) ?? "null",
      ) as BuyNowCheckoutIntent | null;
      return value?.productId ? value : null;
    } catch {
      return null;
    }
  },
  clear() {
    window.sessionStorage.removeItem(KEY);
  },
};
