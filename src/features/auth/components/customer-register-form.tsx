"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, Phone, UserPlus, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/src/core/api";
import { useAuth } from "@/src/providers/storefront-provider";

type RegisterField = "fullName" | "phone" | "email" | "password" | "confirmPassword";
type RegisterErrors = Partial<Record<RegisterField, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^(?:\+?84|0)\d{9,10}$/;

export function CustomerRegisterForm() {
  const router = useRouter();
  const { user, isLoading, register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<RegisterErrors>({});

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const errors = validateRegisterForm({
      fullName,
      phone,
      email,
      password,
      confirmPassword,
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const authUser = await register({
        fullName: fullName.trim(),
        phone: phone.trim().replace(/[\s.-]/g, ""),
        email: email.trim() || undefined,
        password,
      });
      toast.success("Đăng ký thành công", {
        description: `Xin chào ${authUser.fullName ?? authUser.email}.`,
      });
      router.replace("/");
    } catch (registerError) {
      const message = registerError instanceof ApiError
        ? registerError.message
        : "Không thể kết nối máy chủ.";
      setError(message);
      toast.error("Không thể đăng ký", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || user) {
    return <div className="h-[620px] w-full max-w-md animate-pulse rounded-2xl border bg-white" />;
  }

  return (
    <div className="w-full max-w-md rounded-2xl border bg-white p-7 shadow-xl shadow-black/5 sm:p-9">
      <div className="mb-7 text-center">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-[#ff5a1f] text-white"><UserPlus /></div>
        <h1 className="text-2xl font-bold">Tạo tài khoản</h1>
        <p className="mt-2 text-sm text-muted-foreground">Đăng ký để mua hàng và đồng bộ giỏ hàng.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <AuthInput icon={UserRound} label="Họ và tên" autoComplete="name" value={fullName} onChange={setFullName} error={fieldErrors.fullName} placeholder="Nguyễn Văn A" />
        <AuthInput icon={Phone} label="Số điện thoại" type="tel" autoComplete="tel" value={phone} onChange={setPhone} error={fieldErrors.phone} placeholder="0901234567" />
        <AuthInput icon={Mail} label="Email (không bắt buộc)" type="text" autoComplete="email" value={email} onChange={setEmail} error={fieldErrors.email} placeholder="customer@shopnow.vn" />
        <label className="block space-y-2 text-sm font-medium">
          <span>Mật khẩu</span>
          <div className="relative">
            <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 px-10" aria-invalid={Boolean(fieldErrors.password)} placeholder="Tối thiểu 6 ký tự" />
            <button type="button" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
          </div>
          {fieldErrors.password && <span className="block text-xs font-normal text-red-600">{fieldErrors.password}</span>}
        </label>
        <AuthInput icon={LockKeyhole} label="Xác nhận mật khẩu" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={setConfirmPassword} error={fieldErrors.confirmPassword} placeholder="Nhập lại mật khẩu" />
        <Button type="submit" disabled={isSubmitting} className="h-11 w-full bg-[#ff5a1f] text-white hover:bg-[#e94b13]">{isSubmitting ? "Đang đăng ký..." : "Đăng ký"}</Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Đã có tài khoản? <Link href="/login" className="font-semibold text-[#ff5a1f] hover:underline">Đăng nhập</Link>
      </p>
    </div>
  );
}

interface AuthInputProps {
  icon: typeof UserRound;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
}

function AuthInput({ icon: Icon, label, value, onChange, error, ...props }: AuthInputProps) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input {...props} value={value} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} className="h-11 pl-10" />
      </div>
      {error && <span className="block text-xs font-normal text-red-600">{error}</span>}
    </label>
  );
}

function validateRegisterForm(values: {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}): RegisterErrors {
  const errors: RegisterErrors = {};
  const fullName = values.fullName.trim();
  const phone = values.phone.trim().replace(/[\s.-]/g, "");
  const email = values.email.trim();

  if (!fullName) errors.fullName = "Vui lòng nhập họ và tên.";
  else if (fullName.length > 150) errors.fullName = "Họ và tên không được vượt quá 150 ký tự.";

  if (!phone) errors.phone = "Vui lòng nhập số điện thoại.";
  else if (!phonePattern.test(phone)) errors.phone = "Số điện thoại không đúng định dạng.";

  if (email && !emailPattern.test(email)) errors.email = "Email không đúng định dạng.";

  if (!values.password) errors.password = "Vui lòng nhập mật khẩu.";
  else if (values.password.length < 6) errors.password = "Mật khẩu phải có ít nhất 6 ký tự.";

  if (!values.confirmPassword) errors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
  else if (values.confirmPassword !== values.password) errors.confirmPassword = "Mật khẩu xác nhận không khớp.";

  return errors;
}
