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
import type { OrderFilters as OrderFilterValues, OrderState } from "@/lib/types/order";

const ALL_VALUE = "__all__";

const clients = [
  ["client_nanovest", "Nanovest"],
  ["client_acme", "Acme Capital"],
  ["client_blockprime", "BlockPrime"],
] as const;

const symbols = ["AAPL", "TSLA", "MSFT", "GOOGL", "SPY"] as const;

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

interface OrderFiltersProps {
  value: OrderFilterValues;
  onChange: (value: OrderFilterValues) => void;
  onClear: () => void;
  clients?: readonly (readonly [string, string])[];
}

interface FilterSelectProps {
  label: string;
  value: string;
  allLabel: string;
  options: readonly (readonly [string, string])[];
  onChange: (value: string) => void;
}

function FilterSelect({
  label,
  value,
  allLabel,
  options,
  onChange,
}: FilterSelectProps) {
  const selectedLabel =
    options.find(([optionValue]) => optionValue === value)?.[1] ?? allLabel;

  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Select
        modal={false}
        value={value || ALL_VALUE}
        onValueChange={(nextValue) =>
          onChange(nextValue === ALL_VALUE ? "" : String(nextValue))
        }
      >
        <SelectTrigger aria-label={label} className="w-full min-w-36">
          <SelectValue>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value={ALL_VALUE}>{allLabel}</SelectItem>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function OrderFilters({
  value,
  onChange,
  onClear,
  clients: clientOptions = clients,
}: OrderFiltersProps) {
  const update = (key: keyof OrderFilterValues, nextValue: string) => {
    onChange({ ...value, [key]: nextValue });
  };

  return (
    <section
      aria-label="Order filters"
      className="rounded-xl border bg-card p-4 shadow-sm"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {clientOptions.length ? (
          <FilterSelect
            label="Client"
            value={value.clientId}
            allLabel="All clients"
            options={clientOptions}
            onChange={(nextValue) => update("clientId", nextValue)}
          />
        ) : (
          <div className="grid gap-1.5">
            <label
              htmlFor="order-client-id"
              className="text-xs font-medium text-muted-foreground"
            >
              Client ID
            </label>
            <Input
              id="order-client-id"
              value={value.clientId}
              placeholder="Client UUID"
              onChange={(event) => update("clientId", event.target.value)}
            />
          </div>
        )}

        <div className="grid gap-1.5">
          <label
            htmlFor="order-end-user"
            className="text-xs font-medium text-muted-foreground"
          >
            End user
          </label>
          <Input
            id="order-end-user"
            value={value.endUserId}
            placeholder="Search ID"
            onChange={(event) => update("endUserId", event.target.value)}
          />
        </div>

        <FilterSelect
          label="Symbol"
          value={value.symbol}
          allLabel="All symbols"
          options={symbols.map((symbol) => [symbol, symbol] as const)}
          onChange={(nextValue) => update("symbol", nextValue)}
        />

        <FilterSelect
          label="Status"
          value={value.status}
          allLabel="All statuses"
          options={states.map((state) => [state, state] as const)}
          onChange={(nextValue) => update("status", nextValue)}
        />

        <div className="grid gap-1.5">
          <label
            htmlFor="order-from-date"
            className="text-xs font-medium text-muted-foreground"
          >
            From date
          </label>
          <Input
            id="order-from-date"
            type="date"
            value={value.fromDate}
            onChange={(event) => update("fromDate", event.target.value)}
          />
        </div>

        <div className="grid gap-1.5">
          <label
            htmlFor="order-to-date"
            className="text-xs font-medium text-muted-foreground"
          >
            To date
          </label>
          <Input
            id="order-to-date"
            type="date"
            value={value.toDate}
            onChange={(event) => update("toDate", event.target.value)}
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
