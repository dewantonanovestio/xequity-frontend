"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { EndUserPicker } from "@/components/client/EndUserPicker";
import { HoldingsTable } from "@/components/portfolio/HoldingsTable";
import { Skeleton } from "@/components/ui/skeleton";

function PortfolioContent() {
  const { clientId } = useParams<{ clientId: string }>();
  const searchParams = useSearchParams();
  const endUserId = searchParams.get("endUserId") ?? "";

  return (
    <section className="mx-auto grid w-full max-w-[1400px] gap-5">
      <header>
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Assets</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Portfolio</h1>
        <p className="mt-1 text-sm text-muted-foreground">Holdings valued at the latest sell price.</p>
      </header>
      <EndUserPicker clientId={clientId} basePath={`/client/${clientId}/portfolio`} />
      <HoldingsTable endUserId={endUserId} clientId={clientId} />
    </section>
  );
}

export default function PortfolioPage() {
  return <Suspense fallback={<Skeleton className="h-72 w-full rounded-xl" />}><PortfolioContent /></Suspense>;
}
