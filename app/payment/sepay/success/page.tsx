import { PaymentResultView } from "@/src/features/orders/components/payment-result-view";

export default async function SepaySuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentId?: string }>;
}) {
  const { paymentId } = await searchParams;
  return <PaymentResultView initialResult="success" paymentId={paymentId} />;
}
