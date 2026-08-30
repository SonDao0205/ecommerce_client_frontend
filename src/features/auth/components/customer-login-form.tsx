"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, LogIn, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/src/core/api";
import { useAuth } from "@/src/providers/storefront-provider";
import { useDebouncedCallback } from "@/src/hooks/use-debounced-callback";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^(?:\+?84|0)\d{9,10}$/;

export function CustomerLoginForm() {
  const router = useRouter();
  const { user, isLoading, login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  const submitLogin = useDebouncedCallback(async (normalizedIdentifier: string, submittedPassword: string) => {
    try {
      const authUser = await login({ identifier: normalizedIdentifier, password: submittedPassword });
      toast.success("Đăng nhập thành công", {
        description: `Xin chào ${authUser.fullName ?? authUser.email}. Giỏ hàng khách đang được đồng bộ.`,
      });
      router.replace("/cart");
    } catch (loginError) {
      setError(loginError instanceof ApiError ? loginError.message : "Không thể kết nối máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  }, 400);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);
    const normalizedIdentifier = normalizeIdentifier(identifier);
    const nextIdentifierError = validateIdentifier(normalizedIdentifier);
    const nextPasswordError = password ? null : "Vui lòng nhập mật khẩu.";
    setIdentifierError(nextIdentifierError);
    setPasswordError(nextPasswordError);
    if (nextIdentifierError || nextPasswordError) return;
    setIsSubmitting(true);
    submitLogin(normalizedIdentifier, password);
  }

  if (isLoading || user) {
    return <div className="h-96 w-full max-w-md animate-pulse rounded-2xl border bg-white" />;
  }

  return (
    <div className="w-full max-w-md rounded-2xl border bg-white p-7 shadow-xl shadow-black/5 sm:p-9">
      <div className="mb-7 text-center">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-[#ff5a1f] text-white"><LogIn /></div>
        <h1 className="text-2xl font-bold">Đăng nhập tài khoản</h1>
        <p className="mt-2 text-sm text-muted-foreground">Đăng nhập để đồng bộ giỏ hàng trên mọi thiết bị.</p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <label className="block space-y-2 text-sm font-medium">
          <span>Email hoặc số điện thoại</span>
          <div className="relative"><Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input type="text" autoComplete="username" value={identifier} aria-invalid={Boolean(identifierError)} onChange={(event) => setIdentifier(event.target.value)} className="h-11 pl-10" placeholder="customer@shopnow.vn hoặc 0901234567" /></div>
          {identifierError && <span className="block text-xs font-normal text-red-600">{identifierError}</span>}
        </label>
        <label className="block space-y-2 text-sm font-medium">
          <span>Mật khẩu</span>
          <div className="relative"><LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} aria-invalid={Boolean(passwordError)} onChange={(event) => setPassword(event.target.value)} className="h-11 px-10" placeholder="Nhập mật khẩu" /><button type="button" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>
          {passwordError && <span className="block text-xs font-normal text-red-600">{passwordError}</span>}
        </label>
        <Button type="submit" disabled={isSubmitting} className="h-11 w-full bg-[#ff5a1f] text-white hover:bg-[#e94b13]">{isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Chưa có tài khoản? <Link href="/register" className="font-semibold text-[#ff5a1f] hover:underline">Đăng ký ngay</Link>
      </p>
    </div>
  );
}

function normalizeIdentifier(value: string): string {
  const trimmed = value.trim();
  return trimmed.includes("@") ? trimmed : trimmed.replace(/[\s.-]/g, "");
}

function validateIdentifier(value: string): string | null {
  if (!value) return "Vui lòng nhập email hoặc số điện thoại.";
  if (value.includes("@")) {
    return emailPattern.test(value) ? null : "Email không đúng định dạng.";
  }
  return phonePattern.test(value) ? null : "Số điện thoại không đúng định dạng.";
}
