const ACCESS_TOKEN_KEY = "storefront_access_token";
const REFRESH_TOKEN_KEY = "storefront_refresh_token";
const USER_KEY = "storefront_auth_user";
const AUTH_CHANGE_EVENT = "shopnow:storefront-auth-change";

export class TokenStorage {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getUser<T>(): T | null {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(window.localStorage.getItem(USER_KEY) ?? "null") as T | null;
    } catch {
      return null;
    }
  }

  setSession(accessToken: string, refreshToken: string, user: unknown): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.notify();
  }

  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    if (typeof window === "undefined") return () => undefined;
    window.addEventListener("storage", listener);
    window.addEventListener(AUTH_CHANGE_EVENT, listener);
    return () => {
      window.removeEventListener("storage", listener);
      window.removeEventListener(AUTH_CHANGE_EVENT, listener);
    };
  }

  private notify(): void {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

export const tokenStorage = new TokenStorage();
