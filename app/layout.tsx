import type { Metadata } from "next";
import { StorefrontProvider } from "@/src/providers/storefront-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ShopNow | Mua sắm trực tuyến",
    template: "%s | ShopNow",
  },
  description: "Sản phẩm chính hãng, giao hàng nhanh và đổi trả dễ dàng tại ShopNow.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <StorefrontProvider>{children}</StorefrontProvider>
      </body>
    </html>
  );
}
