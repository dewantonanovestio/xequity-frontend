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
import { BACKEND_TRANSACTION_TYPES } from "@/lib/ledger/ledgerUtils";
import type { TransactionFilters as TransactionFilterValues } from "@/lib/types/ledger";

const ALL_VALUE = "__all__";

const clients = [
  ["client_nanovest", "Nanovest"],
  ["client_acme", "Acme Capital"],
  ["client_blockprime", "BlockPrime"],
] as const;

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
        <SelectTrigger aria-label={label} className="w-full min-w-44">
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

interface TransactionFiltersProps {
  value: TransactionFilterValues;
  onChange: (value: TransactionFilterValues) => void;
  onClear: () => void;
  clients?: readonly (readonly [string, string])[];
  transactionTypes?: readonly string[];
}

export function TransactionFilters({
  value,
  onChange,
  onClear,
  clients: clientOptions = clients,
  transactionTypes = BACKEND_TRANSACTION_TYPES,
}: TransactionFiltersProps) {
  const update = (key: keyof TransactionFilterValues, nextValue: string) => {
    onChange({ ...value, [key]: nextValue });
  };

  return (
    <section
      aria-label="Transaction filters"
      className="rounded-xl border bg-card p-4 shadow-sm"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
              htmlFor="transaction-client-id"
              className="text-xs font-medium text-muted-foreground"
            >
              Client ID
            </label>
            <Input
              id="transaction-client-id"
              value={value.clientId}
              placeholder="Client UUID"
              onChange={(event) => update("clientId", event.target.value)}
            />
          </div>
        )}

        <FilterSelect
          label="Transaction Type"
          value={value.type}
          allLabel="All transaction types"
          options={transactionTypes.map((type) => [type, type] as const)}
          onChange={(nextValue) => update("type", nextValue)}
        />

        <div className="grid gap-1.5">
          <label
            htmlFor="transaction-from-date"
            className="text-xs font-medium text-muted-foreground"
          >
            From date
          </label>
          <Input
            id="transaction-from-date"
            type="date"
            value={value.fromDate}
            onChange={(event) => update("fromDate", event.target.value)}
          />
        </div>

        <div className="grid gap-1.5">
          <label
            htmlFor="transaction-to-date"
            className="text-xs font-medium text-muted-foreground"
          >
            To date
          </label>
          <Input
            id="transaction-to-date"
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
