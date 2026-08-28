import type { ApiRequestOptions, ApiResponse } from "@/src/types/api";
import { tokenStorage } from "@/src/core/auth/token-storage";
import { ApiError } from "./api-error";

type ApiEnvelope<T> = Partial<ApiResponse<T>> & { data?: T; message?: string };

export class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly getToken: () => string | null = () => tokenStorage.getAccessToken(),
  ) {}

  get<T>(path: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  patch<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  delete<T>(path: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  private async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const { body, skipAuth, headers, ...requestInit } = options;
    const token = skipAuth ? null : this.getToken();
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`, {
      ...requestInit,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const payload = await this.parseResponse<T>(response);
    if (!response.ok) {
      const errorPayload = payload as ApiEnvelope<unknown> | undefined;
      if (response.status === 401 && !skipAuth) tokenStorage.clear();
      throw new ApiError(
        errorPayload?.message ?? `Request failed with status ${response.status}`,
        response.status,
        payload,
      );
    }
    return this.isEnvelope<T>(payload) ? (payload.data as T) : (payload as T);
  }

  private async parseResponse<T>(response: Response): Promise<T | undefined> {
    if (response.status === 204) return undefined;
    const contentType = response.headers.get("content-type");
    return contentType?.includes("application/json")
      ? ((await response.json()) as T)
      : ((await response.text()) as T);
  }

  private isEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
    return typeof value === "object" && value !== null && "data" in value;
  }
}

export const httpClient = new HttpClient(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1",
);
