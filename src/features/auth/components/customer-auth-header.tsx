import Link from "next/link";

export function CustomerAuthHeader() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-center px-4">
        <Link href="/" className="text-2xl font-black tracking-tight text-[#ff5a1f]">
          ShopNow
        </Link>
      </div>
    </header>
  );
}
