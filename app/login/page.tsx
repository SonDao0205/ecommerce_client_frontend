import type { Metadata } from "next";
import { CustomerLoginForm } from "@/src/features/auth/components/customer-login-form";
import { StorefrontFooter } from "@/src/features/storefront/components/storefront-footer";
import { CustomerAuthHeader } from "@/src/features/auth/components/customer-auth-header";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      <CustomerAuthHeader />
      <main className="grid min-h-[68vh] place-items-center px-4 py-12"><CustomerLoginForm /></main>
      <StorefrontFooter />
    </div>
  );
}
