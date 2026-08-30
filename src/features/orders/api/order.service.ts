import { ApiError, BaseApiService, httpClient } from "@/src/core/api";
import type {
  BuyNowOrderPayload,
  Order,
  OrderRecipientPayload,
  OrderStatus,
  OrderSummary,
  VoucherPreview,
  VoucherPreviewPayload,
} from "../types/order";
import type { PaginatedData } from "@/src/types/api";

export class OrderService extends BaseApiService {
  constructor() {
    super(httpClient, "/orders");
  }

  createFromCart(
    payload: OrderRecipientPayload,
    idempotencyKey: string,
  ): Promise<Order> {
    return this.post<Order>("from-cart", payload, {
      headers: { "Idempotency-Key": idempotencyKey },
    });
  }

  buyNow(payload: BuyNowOrderPayload, idempotencyKey: string): Promise<Order> {
    return this.post<Order>("buy-now", payload, {
      headers: { "Idempotency-Key": idempotencyKey },
    });
  }

  previewVoucher(payload: VoucherPreviewPayload): Promise<VoucherPreview> {
    return this.post<VoucherPreview>("voucher-preview", payload);
  }

  getMyOrders(
    query: { page?: number; limit?: number; status?: OrderStatus } = {},
  ): Promise<PaginatedData<OrderSummary>> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) params.set(key, String(value));
    });
    const suffix = params.size ? `?${params.toString()}` : "";
    return this.get<PaginatedData<OrderSummary>>(`my${suffix}`, {
      cache: "no-store",
    });
  }

  getMyOrder(id: string): Promise<Order> {
    return this.get<Order>(`my/${id}`, { cache: "no-store" });
  }

  cancelMyOrder(id: string, reason: string): Promise<Order> {
    return this.patch<Order>(`my/${id}/cancel`, { reason });
  }

  async requestReturn(
    id: string,
    reason: string,
    files: File[],
  ): Promise<Order> {
    if (files.length > 6)
      throw new ApiError("Chỉ được chọn tối đa 6 media", 400);
    files.forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const limit = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      if ((!isImage && !isVideo) || file.size > limit) {
        throw new ApiError(
          `${file.name}: ảnh tối đa 5 MB, video tối đa 50 MB`,
          400,
        );
      }
    });

    const uploaded: ReturnEvidenceAsset[] = [];
    try {
      if (files.length) {
        const signature = await httpClient.post<CloudinarySignature>(
          "/cloudinary/return-evidence/upload-signature",
        );
        const results = new Array<ReturnEvidenceAsset | undefined>(
          files.length,
        );
        const failedIndexes: number[] = [];
        let cursor = 0;
        await Promise.all(
          Array.from({ length: Math.min(3, files.length) }, async () => {
            while (cursor < files.length) {
              const index = cursor++;
              try {
                results[index] = await this.uploadEvidence(
                  files[index],
                  signature,
                );
              } catch {
                failedIndexes.push(index);
              }
            }
          }),
        );
        uploaded.push(
          ...results.filter((item): item is ReturnEvidenceAsset =>
            Boolean(item),
          ),
        );
        if (failedIndexes.length) {
          throw new ApiError(
            "Một hoặc nhiều media minh chứng tải lên thất bại",
            502,
            {
              failedIndexes: failedIndexes.sort((left, right) => left - right),
            },
          );
        }
      }
      return await this.patch<Order>(`my/${id}/return-request`, {
        reason,
        evidence: uploaded,
      });
    } catch (error) {
      // Chỉ dọn khi server/Cloudinary đã trả lỗi rõ ràng. Lỗi mạng là trạng
      // thái không chắc chắn: request có thể đã commit nhưng response bị mất.
      if (error instanceof ApiError) await this.cleanupEvidence(uploaded);
      throw error;
    }
  }

  private async uploadEvidence(
    file: File,
    signature: CloudinarySignature,
  ): Promise<ReturnEvidenceAsset> {
    const body = new FormData();
    body.append("file", file);
    body.append("api_key", signature.apiKey);
    body.append("timestamp", String(signature.timestamp));
    body.append("signature", signature.signature);
    body.append("folder", signature.folder);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/auto/upload`,
      { method: "POST", body },
    );
    if (!response.ok) throw new ApiError(`Không thể tải ${file.name}`, 502);
    const result = (await response.json()) as {
      secure_url: string;
      public_id: string;
      resource_type: string;
    };
    return {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type === "video" ? "video" : "image",
    };
  }

  private async cleanupEvidence(assets: ReturnEvidenceAsset[]): Promise<void> {
    if (!assets.length) return;
    try {
      await httpClient.post<null>("/cloudinary/return-evidence/cleanup", {
        assets: assets.map(({ publicId, resourceType }) => ({
          publicId,
          resourceType,
        })),
      });
    } catch {
      // Cleanup là best effort, giữ nguyên lỗi gốc của upload/yêu cầu hoàn trả.
    }
  }
}

interface CloudinarySignature {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

interface ReturnEvidenceAsset {
  url: string;
  publicId: string;
  resourceType: "image" | "video";
}

export const orderService = new OrderService();
