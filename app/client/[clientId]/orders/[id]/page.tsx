"use client";

import { useParams, useSearchParams } from "next/navigation";
import { OrderDetailContainer } from "@/components/orders/OrderDetailContainer";

export default function ClientOrderDetailPage() {
  const { clientId, id } = useParams<{ clientId: string; id: string }>();
  const searchParams = useSearchParams();
  const kindParam = searchParams.get("kind");
  const kind = kindParam === "order" || kindParam === "redemption" ? kindParam : undefined;

  return (
    <section className="mx-auto w-full max-w-6xl">
      <OrderDetailContainer id={id} kind={kind} actionsMode="user" backHref={`/client/${clientId}/orders`} />
    </section>
  );
}
