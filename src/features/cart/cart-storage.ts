import type { CartRequestItem, LocalCartItem } from "./types/cart";

const CART_KEY = "shopnow_guest_cart";
const CART_CHANGE_EVENT = "shopnow:cart-change";

export class CartStorage {
  getItems(): LocalCartItem[] {
    if (typeof window === "undefined") return [];
    try {
      const value = JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]") as LocalCartItem[];
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  add(item: CartRequestItem): LocalCartItem[] {
    const items = this.getItems();
    const key = this.createKey(item);
    const existing = items.find((entry) => entry.key === key);
    if (existing) existing.quantity = Math.min(99, existing.quantity + item.quantity);
    else items.push({ ...item, key, quantity: Math.min(99, item.quantity) });
    return this.save(items);
  }

  update(key: string, quantity: number): LocalCartItem[] {
    const items = this.getItems();
    const item = items.find((entry) => entry.key === key);
    if (item) item.quantity = Math.max(1, Math.min(99, quantity));
    return this.save(items);
  }

  remove(key: string): LocalCartItem[] {
    return this.save(this.getItems().filter((item) => item.key !== key));
  }

  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(CART_KEY);
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    if (typeof window === "undefined") return () => undefined;
    window.addEventListener("storage", listener);
    window.addEventListener(CART_CHANGE_EVENT, listener);
    return () => {
      window.removeEventListener("storage", listener);
      window.removeEventListener(CART_CHANGE_EVENT, listener);
    };
  }

  private save(items: LocalCartItem[]): LocalCartItem[] {
    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
    this.notify();
    return items;
  }

  private createKey(item: CartRequestItem): string {
    return `${item.productSku ?? item.productId}:${item.variantSku ?? item.variantId ?? "base"}`;
  }

  private notify(): void {
    window.dispatchEvent(new Event(CART_CHANGE_EVENT));
  }
}

export const cartStorage = new CartStorage();
