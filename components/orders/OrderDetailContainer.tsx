"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { ActionButtons } from "@/components/orders/ActionButtons";
import { UserOrderActions } from "@/components/orders/UserOrderActions";
import { OrderDetail } from "@/components/orders/OrderDetail";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetOrderFillsQuery,
  useGetOrderQuery,
  useGetRedemptionFillsQuery,
  useGetRedemptionQuery,
} from "@/lib/api/ordersApi";
import { getOrderKind } from "@/lib/orders/orderUtils";
import { cn } from "@/lib/utils";

interface OrderDetailContainerProps {
  id: string;
  kind?: "order" | "redemption";
  actionsMode?: "admin" | "user";
  backHref?: string;
}

function hasStatus(error: unknown, status: number) {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === status
  );
}

function DetailLoading() {
  return (
    <div aria-label="Loading order details" className="grid gap-5">
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function OrderDetailContainer({ id, kind: kindHint, actionsMode = "admin", backHref = "/admin/orders" }: OrderDetailContainerProps) {
  const inferredKind = getOrderKind(id);
  const initialKind = kindHint ?? (inferredKind === "unknown" ? undefined : inferredKind);
  const supportsFallback = isUuid(id);
  const queriesOrder = initialKind !== "redemption" && (Boolean(initialKind) || supportsFallback);
  const orderQuery = useGetOrderQuery(id, {
    pollingInterval: 5000,
    skip: !queriesOrder,
  });
  const triesRedemption =
    initialKind === "redemption" ||
    (initialKind === undefined &&
      supportsFallback &&
      orderQuery.isError &&
      hasStatus(orderQuery.error, 404));
  const redemptionQuery = useGetRedemptionQuery(id, {
    pollingInterval: 5000,
    skip: !triesRedemption,
  });
  const resolvedKind =
    initialKind ??
    (orderQuery.data
      ? "order"
      : redemptionQuery.data
        ? "redemption"
        : undefined);
  const orderFillsQuery = useGetOrderFillsQuery(id, {
    skip: resolvedKind !== "order",
  });
  const redemptionFillsQuery = useGetRedemptionFillsQuery(id, {
    skip: resolvedKind !== "redemption",
  });

  if (!initialKind && !supportsFallback) {
    return (
      <div role="alert" className="rounded-xl border p-6">
        <h1 className="text-lg font-semibold">Unsupported order identifier.</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Expected an identifier beginning with ord_ or red_.
        </p>
      </div>
    );
  }

  const detailQuery = resolvedKind === "redemption" ? redemptionQuery : orderQuery;
  const fillsQuery =
    resolvedKind === "redemption" ? redemptionFillsQuery : orderFillsQuery;
  const isLoading =
    detailQuery.isLoading ||
    (!resolvedKind && triesRedemption && redemptionQuery.isLoading) ||
    (Boolean(resolvedKind) && fillsQuery.isLoading);
  const isError = detailQuery.isError || fillsQuery.isError;
  const error = detailQuery.error ?? fillsQuery.error;

  if (isLoading) return <DetailLoading />;

  if (isError || !detailQuery.data) {
    const isNotFound = hasStatus(error, 404);
    const entity = resolvedKind === "redemption" ? "Redemption" : "Order";

    return (
      <div role="alert" className="rounded-xl border p-6">
        <h1 className="text-lg font-semibold">
          {isNotFound
            ? `${entity} ${id} was not found.`
            : "Order details could not be loaded."}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isNotFound
            ? "Check the identifier and try again."
            : "The detail and fill services must both be available for this view."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div>
        <Link
          href={backHref}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowLeft aria-hidden="true" />
          Back to orders
        </Link>
      </div>
      <OrderDetail
        order={detailQuery.data}
        fills={fillsQuery.data ?? []}
        actions={
          actionsMode === "user"
            ? <UserOrderActions order={detailQuery.data} />
            : <ActionButtons order={detailQuery.data} />
        }
      />
    </div>
  );
}
