import type { Metadata } from "next";
import { CustomerAuthHeader } from "@/src/features/auth/components/customer-auth-header";
import { CustomerRegisterForm } from "@/src/features/auth/components/customer-register-form";
import { StorefrontFooter } from "@/src/features/storefront/components/storefront-footer";

export const metadata: Metadata = { title: "Đăng ký" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      <CustomerAuthHeader />
      <main className="grid min-h-[68vh] place-items-center px-4 py-12">
        <CustomerRegisterForm />
      </main>
      <StorefrontFooter />
    </div>
  );
}
