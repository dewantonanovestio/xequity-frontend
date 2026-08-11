"use client";

import { CashRecon } from "@/components/recon/CashRecon";
import { SupplyRecon } from "@/components/recon/SupplyRecon";
import {
  useGetCashReconQuery,
  useGetSupplyReconQuery,
} from "@/lib/api/reconApi";

const pollingOptions = { pollingInterval: 30_000 };

export default function ReconPage() {
  const cashQuery = useGetCashReconQuery(undefined, pollingOptions);
  const supplyQuery = useGetSupplyReconQuery(undefined, pollingOptions);

  return (
    <section className="mx-auto grid w-full max-w-[1500px] gap-5">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          System balance
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Reconciliation</h1>
        <p className="text-sm text-muted-foreground">
          Compare cash reserves and token supply across the ledger, wallet, and
          brokerage.
        </p>
      </header>

      <CashRecon
        cash={cashQuery.data ?? null}
        isLoading={cashQuery.isLoading}
        isError={cashQuery.isError}
      />
      <SupplyRecon
        rows={supplyQuery.data ?? []}
        isLoading={supplyQuery.isLoading}
        isError={supplyQuery.isError}
      />
    </section>
  );
}
