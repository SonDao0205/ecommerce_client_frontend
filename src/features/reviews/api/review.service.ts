import { ApiError, BaseApiService, httpClient } from "@/src/core/api";
import type {
  ProductReview,
  ProductReviewPage,
  ReviewMedia,
} from "../types/review";

export class ReviewService extends BaseApiService {
  constructor() {
    super(httpClient, "/reviews");
  }
  getProductReviews(
    slug: string,
    page = 1,
    limit = 5,
  ): Promise<ProductReviewPage> {
    return this.get(
      `products/${encodeURIComponent(slug)}?page=${page}&limit=${limit}`,
      { skipAuth: true, cache: "no-store" },
    );
  }
  async create(
    orderItemId: string,
    rating: number,
    content: string,
    files: File[],
  ): Promise<ProductReview> {
    this.validateFiles(files);
    const uploaded: ReviewMedia[] = [];
    try {
      if (files.length) {
        const signature = await httpClient.post<CloudinarySignature>(
          "/cloudinary/reviews/upload-signature",
        );
        const results = new Array<ReviewMedia | undefined>(files.length);
        let cursor = 0;
        let uploadError: unknown;
        await Promise.all(
          Array.from({ length: Math.min(3, files.length) }, async () => {
            while (cursor < files.length) {
              const index = cursor++;
              try {
                results[index] = await this.upload(files[index], signature);
              } catch (error) {
                uploadError ??= error;
              }
            }
          }),
        );
        uploaded.push(
          ...results.filter((item): item is ReviewMedia => Boolean(item)),
        );
        if (uploadError) throw uploadError;
      }
      return await this.post("", {
        orderItemId,
        rating,
        content,
        media: uploaded,
      });
    } catch (error) {
      if (uploaded.length) await this.cleanup(uploaded);
      throw error;
    }
  }
  private validateFiles(files: File[]) {
    if (files.length > 6)
      throw new ApiError("Chỉ được đăng tối đa 6 ảnh hoặc video", 400);
    files.forEach((file) => {
      const video = file.type.startsWith("video/");
      const limit = video ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      if ((!video && !file.type.startsWith("image/")) || file.size > limit)
        throw new ApiError(
          `${file.name}: ảnh tối đa 5 MB, video tối đa 50 MB`,
          400,
        );
    });
  }
  private async upload(
    file: File,
    signature: CloudinarySignature,
  ): Promise<ReviewMedia> {
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
  private async cleanup(assets: ReviewMedia[]) {
    try {
      await httpClient.post("/cloudinary/reviews/cleanup", {
        assets: assets.map(({ publicId, resourceType }) => ({
          publicId,
          resourceType,
        })),
      });
    } catch {}
  }
}
interface CloudinarySignature {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}
export const reviewService = new ReviewService();
