"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrderState } from "@/lib/types/order";

const ALL_VALUE = "__all__";

const states: OrderState[] = [
  "SUBMITTED",
  "VALIDATED",
  "QUEUED",
  "OPEN_EXECUTING",
  "PARTIALLY_FILLED",
  "FILLED",
  "LOCKING",
  "LOCKED",
  "SELLING",
  "BURNING",
  "MINTING",
  "SETTLED",
  "MINT_FAILED",
  "BURN_FAILED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
];

export type HistoryFilters = {
  status: string;
  fromDate: string;
  toDate: string;
};

interface ClientOrderFiltersProps {
  value: HistoryFilters;
  onChange: (value: HistoryFilters) => void;
  onClear: () => void;
}

export function ClientOrderFilters({ value, onChange, onClear }: ClientOrderFiltersProps) {
  const update = <K extends keyof HistoryFilters>(key: K, next: string) => {
    onChange({ ...value, [key]: next });
  };

  return (
    <section aria-label="Order filters" className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Status */}
        <div className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <Select
            modal={false}
            value={value.status || ALL_VALUE}
            onValueChange={(v) => update("status", v === ALL_VALUE ? "" : (v ?? ""))}
          >
            <SelectTrigger aria-label="Status" className="w-full">
              <SelectValue>{value.status || "All statuses"}</SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value={ALL_VALUE}>All statuses</SelectItem>
              {states.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* From date */}
        <div className="grid gap-1.5">
          <label htmlFor="client-order-from-date" className="text-xs font-medium text-muted-foreground">
            From date
          </label>
          <Input
            id="client-order-from-date"
            type="date"
            value={value.fromDate}
            onChange={(e) => update("fromDate", e.target.value)}
          />
        </div>

        {/* To date */}
        <div className="grid gap-1.5">
          <label htmlFor="client-order-to-date" className="text-xs font-medium text-muted-foreground">
            To date
          </label>
          <Input
            id="client-order-to-date"
            type="date"
            value={value.toDate}
            onChange={(e) => update("toDate", e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="button" variant="ghost" onClick={onClear}>
          <RotateCcw aria-hidden="true" />
          Clear filters
        </Button>
      </div>
    </section>
  );
}
