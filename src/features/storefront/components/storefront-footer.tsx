import Link from "next/link";
import { Headphones, ShieldCheck, Truck, Undo2 } from "lucide-react";

export function StoreBenefits() {
  const benefits = [
    [Truck, "Miễn phí vận chuyển", "Đơn hàng từ 500.000₫"],
    [ShieldCheck, "Hàng chính hãng", "Cam kết nguồn gốc rõ ràng"],
    [Undo2, "Đổi trả dễ dàng", "Trong vòng 30 ngày"],
    [Headphones, "Hỗ trợ 24/7", "Luôn đồng hành cùng bạn"],
  ] as const;
  return (
    <section className="grid gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
      {benefits.map(([Icon, title, text]) => (
        <div key={title} className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-orange-50 text-[#ff5a1f]"><Icon /></div>
          <div><strong className="block text-sm">{title}</strong><span className="text-xs text-muted-foreground">{text}</span></div>
        </div>
      ))}
    </section>
  );
}

export function StorefrontFooter() {
  return (
    <footer className="mt-16 bg-[#1d1d1f] text-zinc-400">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <div><h3 className="mb-3 text-2xl font-black text-[#ff5a1f]">ShopNow</h3><p className="text-sm leading-6">Trải nghiệm mua sắm hiện đại với sản phẩm chính hãng và dịch vụ tận tâm.</p></div>
        <FooterColumn title="Mua sắm" links={["Sản phẩm mới", "Bán chạy", "Khuyến mãi"]} />
        <FooterColumn title="Hỗ trợ" links={["Trung tâm trợ giúp", "Chính sách đổi trả", "Vận chuyển"]} />
        <FooterColumn title="ShopNow" links={["Về chúng tôi", "Liên hệ", "Tuyển dụng"]} />
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return <div><h3 className="mb-3 font-semibold text-white">{title}</h3>{links.map((link) => <Link key={link} href="#" className="block py-1.5 text-sm hover:text-[#ff5a1f]">{link}</Link>)}</div>;
}
