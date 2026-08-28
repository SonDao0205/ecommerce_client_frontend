import type { ApiRequestOptions } from "@/src/types/api";
import { HttpClient } from "./http-client";

export abstract class BaseApiService {
  protected constructor(
    protected readonly http: HttpClient,
    protected readonly resource: string,
  ) {}

  protected get<T>(path = "", options?: ApiRequestOptions): Promise<T> {
    return this.http.get<T>(this.url(path), options);
  }

  protected post<T>(path = "", body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.http.post<T>(this.url(path), body, options);
  }

  protected patch<T>(path = "", body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.http.patch<T>(this.url(path), body, options);
  }

  protected delete<T>(path = "", options?: ApiRequestOptions): Promise<T> {
    return this.http.delete<T>(this.url(path), options);
  }

  private url(path: string): string {
    return path ? `${this.resource}/${path.replace(/^\//, "")}` : this.resource;
  }
}
