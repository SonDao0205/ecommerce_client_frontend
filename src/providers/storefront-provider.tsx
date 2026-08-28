"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { Toaster } from "sonner";
import { tokenStorage } from "@/src/core/auth/token-storage";
import { authService } from "@/src/features/auth/api/auth.service";
import type { AuthUser, LoginPayload, RegisterPayload } from "@/src/features/auth/types/auth";
import { cartService } from "@/src/features/cart/api/cart.service";
import { cartStorage } from "@/src/features/cart/cart-storage";
import type {
  ApiCartSummary,
  CartLine,
  CartRequestItem,
  CartSummary,
  LocalCartItem,
} from "@/src/features/cart/types/cart";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

interface CartContextValue extends CartSummary {
  isLoading: boolean;
  addItem: (item: CartRequestItem) => Promise<void>;
  updateItem: (item: CartLine, quantity: number) => Promise<void>;
  removeItem: (item: CartLine) => Promise<void>;
  clearCart: () => Promise<void>;
  resetCart: () => void;
}

const emptyCart: CartSummary = { items: [], totalQuantity: 0, totalAmount: 0 };
const AuthContext = createContext<AuthContextValue | null>(null);
const CartContext = createContext<CartContextValue | null>(null);

export function StorefrontProvider({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}

function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = () => {
      const hasToken = Boolean(tokenStorage.getAccessToken());
      setUser(hasToken ? tokenStorage.getUser<AuthUser>() : null);
      setIsLoading(false);
    };
    loadSession();
    return tokenStorage.subscribe(loadSession);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const nextUser = await authService.login(payload);
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const nextUser = await authService.register(payload);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    cartStorage.clear();
    setUser(null);
    await authService.logout();
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function CartProvider({ children }: PropsWithChildren) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [cart, setCart] = useState<CartSummary>(emptyCart);
  const [isLoading, setIsLoading] = useState(true);

  const loadGuestCart = useCallback(() => {
    setCart(hydrateLocalCart(cartStorage.getItems()));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    let cancelled = false;

    if (!user) {
      queueMicrotask(loadGuestCart);
      return cartStorage.subscribe(loadGuestCart);
    }

    const synchronize = async () => {
      try {
        const guestItems = cartStorage.getItems();
        const remote = guestItems.length
          ? await cartService.merge(guestItems.map(toCartRequest))
          : await cartService.getCart();
        if (guestItems.length) cartStorage.clear();
        if (!cancelled) setCart(normalizeRemoteCart(remote));
      } catch {
        if (!cancelled) setCart(emptyCart);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    queueMicrotask(() => {
      if (!cancelled) {
        setIsLoading(true);
        void synchronize();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, user, loadGuestCart]);

  const addItem = useCallback(
    async (item: CartRequestItem) => {
      if (user) {
        setCart(normalizeRemoteCart(await cartService.addItem(toCartRequest(item))));
        return;
      }
      setCart(hydrateLocalCart(cartStorage.add(item)));
    },
    [user],
  );

  const updateItem = useCallback(
    async (item: CartLine, quantity: number) => {
      if (item.source === "database") {
        setCart(normalizeRemoteCart(await cartService.updateItem(item.id, quantity)));
        return;
      }
      setCart(hydrateLocalCart(cartStorage.update(item.id, quantity)));
    },
    [],
  );

  const removeItem = useCallback(async (item: CartLine) => {
    if (item.source === "database") {
      setCart(normalizeRemoteCart(await cartService.removeItem(item.id)));
      return;
    }
    setCart(hydrateLocalCart(cartStorage.remove(item.id)));
  }, []);

  const clearCart = useCallback(async () => {
    if (user) {
      setCart(normalizeRemoteCart(await cartService.clear()));
      return;
    }
    cartStorage.clear();
    setCart(emptyCart);
  }, [user]);

  const resetCart = useCallback(() => {
    cartStorage.clear();
    setCart(emptyCart);
  }, []);

  const value = useMemo(
    () => ({ ...cart, isLoading, addItem, updateItem, removeItem, clearCart, resetCart }),
    [cart, isLoading, addItem, updateItem, removeItem, clearCart, resetCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function normalizeRemoteCart(cart: ApiCartSummary): CartSummary {
  return {
    id: cart.id,
    items: cart.items.map((item) => ({ ...item, source: "database" as const })),
    totalQuantity: cart.totalQuantity,
    totalAmount: cart.totalAmount,
  };
}

function hydrateLocalCart(items: LocalCartItem[]): CartSummary {
  const lines = items.flatMap<CartLine>((item) => {
    if (!item.snapshot) return [];
    return [{
      id: item.key,
      source: "local",
      quantity: item.quantity,
      unitPrice: item.snapshot.unitPrice,
      product: item.snapshot.product,
      ...(item.snapshot.variant && { variant: item.snapshot.variant }),
    }];
  });

  return {
    items: lines,
    totalQuantity: lines.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: lines.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  };
}

function toCartRequest(item: CartRequestItem): CartRequestItem {
  return {
    productId: item.productId,
    productSku: item.productSku,
    variantId: item.variantId,
    variantSku: item.variantSku,
    quantity: item.quantity,
  };
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside StorefrontProvider");
  return value;
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside StorefrontProvider");
  return value;
}
