"use client";

import { LoaderCircle, MapPinHouse, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/src/core/api";
import { useAuth } from "@/src/providers/storefront-provider";
import { customerAddressService } from "../api/customer-address.service";
import type { CustomerAddress } from "../types/customer-address";

export function CustomerProfileView() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<CustomerAddress | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    customerAddressService
      .getDefault()
      .then((saved) => {
        if (cancelled) return;
        setProfile(saved);
        setRecipientName(saved?.recipientName ?? user.fullName ?? "");
        setPhone(saved?.phone ?? user.phone ?? "");
        setAddress(saved?.address ?? "");
      })
      .catch((error) => {
        if (!cancelled) toast.error("Không thể tải hồ sơ", {
          description: error instanceof ApiError ? error.message : "Vui lòng thử lại sau.",
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      isDefault: true,
    };
    const nextErrors: Record<string, string> = {};
    if (!payload.recipientName) nextErrors.recipientName = "Vui lòng nhập họ và tên.";
    if (!/^(?:\+84|0)\d{9,10}$/.test(payload.phone)) nextErrors.phone = "Số điện thoại không đúng định dạng.";
    if (!payload.address) nextErrors.address = "Vui lòng nhập địa chỉ.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const saved = await customerAddressService.saveDefault(payload);
      setProfile(saved);
      toast.success("Đã lưu hồ sơ giao hàng");
    } catch (error) {
      toast.error("Không thể lưu hồ sơ", {
        description: error instanceof ApiError ? error.message : "Vui lòng thử lại sau.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading || !user) {
    return <div className="grid min-h-96 place-items-center"><LoaderCircle className="size-8 animate-spin text-[#ff5a1f]" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#ff5a1f]">Tài khoản của tôi</p>
        <h1 className="mt-1 text-3xl font-bold">Hồ sơ giao hàng</h1>
        <p className="mt-2 text-sm text-muted-foreground">Thông tin này sẽ được tự động điền khi bạn mua ngay hoặc đặt hàng từ giỏ.</p>
      </div>

      <form noValidate onSubmit={(event) => void submit(event)} className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3 rounded-xl bg-orange-50 p-4 text-sm text-orange-800">
          <MapPinHouse className="size-5 shrink-0" />
          <span>Địa chỉ đang lưu được dùng làm địa chỉ mặc định cho các lần đặt hàng tiếp theo.</span>
        </div>
        <Field label="Họ và tên" error={errors.recipientName}>
          <Input maxLength={150} disabled={saving} value={recipientName} onChange={(event) => { setRecipientName(event.target.value); setErrors((value) => ({ ...value, recipientName: "" })); }} />
        </Field>
        <Field label="Số điện thoại" error={errors.phone}>
          <Input inputMode="tel" maxLength={20} disabled={saving} value={phone} onChange={(event) => { setPhone(event.target.value); setErrors((value) => ({ ...value, phone: "" })); }} />
        </Field>
        <Field label="Địa chỉ nhận hàng" error={errors.address}>
          <textarea maxLength={1000} disabled={saving} value={address} onChange={(event) => { setAddress(event.target.value); setErrors((value) => ({ ...value, address: "" })); }} className="min-h-28 w-full resize-y rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-[#ff5a1f] focus:ring-2 focus:ring-orange-100 disabled:opacity-50" />
        </Field>
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={saving} className="bg-[#ff5a1f] text-white hover:bg-[#e94b13]">
            {saving ? <LoaderCircle className="animate-spin" /> : <Save />}
            {saving ? "Đang lưu..." : profile ? "Cập nhật hồ sơ" : "Lưu hồ sơ"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5 text-sm font-medium">{label}{children}{error && <span className="block text-xs font-normal text-red-600">{error}</span>}</label>;
}
