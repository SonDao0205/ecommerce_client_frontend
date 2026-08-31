import type { PaginatedData } from "@/src/types/api";
export interface ReviewMedia {
  url: string;
  publicId: string;
  resourceType: "image" | "video";
}
export interface ProductReview {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantName: string | null;
  variantValue: string | null;
  variantSku: string | null;
  userName: string;
  rating: number;
  content: string;
  media: ReviewMedia[];
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface ProductReviewPage extends PaginatedData<ProductReview> {
  summary: { averageRating: number; reviewCount: number };
}
