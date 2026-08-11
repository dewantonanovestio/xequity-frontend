"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { ActivityTable } from "@/components/activities/ActivityTable";
import { EndUserPicker } from "@/components/client/EndUserPicker";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetActivitiesQuery } from "@/lib/api/activitiesApi";

function ActivitiesContent() {
  const { clientId } = useParams<{ clientId: string }>();
  const searchParams = useSearchParams();
  const endUserId = searchParams.get("endUserId") ?? "";
  const [cursor, setCursor] = useState<string | null>(null);
  const { data, isLoading, isError } = useGetActivitiesQuery(
    { endUserId, cursor },
    { skip: !endUserId },
  );

  return (
    <section className="mx-auto grid w-full max-w-[1200px] gap-5">
      <header>
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Activity</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Activities</h1>
        <p className="mt-1 text-sm text-muted-foreground">Buy and sell fill history for the selected end user.</p>
      </header>
      <EndUserPicker clientId={clientId} basePath={`/client/${clientId}/activities`} />
      {!endUserId ? null : isError ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-destructive">Activities could not be loaded.</div>
      ) : (
        <ActivityTable
          activities={data?.items ?? []}
          isLoading={isLoading}
          nextCursor={data?.nextCursor ?? null}
          onLoadMore={() => { if (data?.nextCursor) setCursor(data.nextCursor); }}
        />
      )}
    </section>
  );
}

export default function ActivitiesPage() {
  return <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}><ActivitiesContent /></Suspense>;
}
