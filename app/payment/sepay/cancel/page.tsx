import { PaymentResultView } from "@/src/features/orders/components/payment-result-view";

export default async function SepayCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentId?: string }>;
}) {
  const { paymentId } = await searchParams;
  return <PaymentResultView initialResult="cancel" paymentId={paymentId} />;
}
