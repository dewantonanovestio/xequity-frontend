"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { ClientOrdersView } from "@/components/orders/ClientOrdersView";
import { Skeleton } from "@/components/ui/skeleton";

function Fallback() {
  return (
    <section className="mx-auto grid w-full max-w-[1500px] gap-5">
      <Skeleton className="h-16 w-80" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </section>
  );
}

export default function ClientOrdersPage() {
  const { clientId } = useParams<{ clientId: string }>();
  return (
    <Suspense fallback={<Fallback />}>
      <ClientOrdersView clientId={clientId} />
    </Suspense>
  );
}
