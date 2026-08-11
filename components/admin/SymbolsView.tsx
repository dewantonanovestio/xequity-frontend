"use client";

import { useState, type FormEvent } from "react";
import { formatDate } from "@/lib/utils/formatters";
import {
  useGetAdminSymbolsQuery,
  useOnboardSymbolMutation,
  useUpdateSymbolStatusMutation,
} from "@/lib/api/userApi";
import type { SymbolStatus } from "@/lib/types/user";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SYMBOL_STATUSES: SymbolStatus[] = [
  "ACTIVE",
  "MINT_HALTED",
  "REDEEM_HALTED",
  "HALTED",
  "DELISTING",
  "RETIRED",
];

function statusLabel(status: SymbolStatus): string {
  return status.replace(/_/g, " ");
}

function statusClass(status: SymbolStatus): string {
  switch (status) {
    case "ACTIVE":
      return "text-emerald-600";
    case "MINT_HALTED":
    case "REDEEM_HALTED":
      return "text-amber-600";
    case "HALTED":
    case "DELISTING":
      return "text-orange-600";
    case "RETIRED":
      return "text-muted-foreground";
  }
}

function apiErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === "object" && data !== null && "message" in data) {
      return String((data as { message: unknown }).message);
    }
  }
  return "The request could not be completed.";
}

function SymbolStatusSelect({ ticker, currentStatus }: { ticker: string; currentStatus: SymbolStatus }) {
  const [updateStatus, { isLoading }] = useUpdateSymbolStatusMutation();
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (value: string) => {
    setError(null);
    try {
      await updateStatus({ ticker, status: value as SymbolStatus }).unwrap();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Select value={currentStatus} onValueChange={handleChange} disabled={isLoading}>
        <SelectTrigger className="h-7 w-36 text-xs">
          <SelectValue>
            <span className={statusClass(currentStatus)}>{statusLabel(currentStatus)}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SYMBOL_STATUSES.map((s) => (
            <SelectItem key={s} value={s} className="text-xs">
              <span className={statusClass(s)}>{statusLabel(s)}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function SymbolsTable() {
  const { data: symbols = [], isLoading, isError } = useGetAdminSymbolsQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Symbols</CardTitle>
        <CardDescription>
          Onboarded symbols with their token proxy address and current status.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Ticker</TableHead>
              <TableHead>Token Proxy Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }, (_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }, (__, j) => (
                    <TableCell key={j} className="first:pl-4 last:pr-4">
                      <Skeleton className="h-5 w-28" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 px-4 text-center">
                  <p role="alert" className="font-medium text-destructive">
                    Symbols could not be loaded.
                  </p>
                </TableCell>
              </TableRow>
            ) : symbols.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 px-4 text-center text-muted-foreground">
                  No symbols onboarded yet.
                </TableCell>
              </TableRow>
            ) : (
              symbols.map((symbol) => (
                <TableRow key={symbol.ticker}>
                  <TableCell className="pl-4 font-medium">{symbol.ticker}</TableCell>
                  <TableCell>
                    {symbol.tokenProxyAddr ? (
                      <span
                        className="font-mono text-xs"
                        title={symbol.tokenProxyAddr}
                      >
                        {symbol.tokenProxyAddr.slice(0, 10)}…{symbol.tokenProxyAddr.slice(-6)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <SymbolStatusSelect ticker={symbol.ticker} currentStatus={symbol.status} />
                  </TableCell>
                  <TableCell className="pr-4 text-muted-foreground">
                    {formatDate(symbol.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function OnboardSymbolForm() {
  const [onboard, { isLoading }] = useOnboardSymbolMutation();
  const [ticker, setTicker] = useState("");
  const [tokenProxyAddr, setTokenProxyAddr] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const canSubmit = ticker.trim() && tokenProxyAddr.trim() && !isLoading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const result = await onboard({
        ticker: ticker.trim().toUpperCase(),
        tokenProxyAddr: tokenProxyAddr.trim(),
      }).unwrap();
      setMessage({ tone: "success", text: `Symbol "${result.ticker}" onboarded successfully.` });
      setTicker("");
      setTokenProxyAddr("");
    } catch (error) {
      setMessage({ tone: "error", text: apiErrorMessage(error) });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboard New Symbol</CardTitle>
        <CardDescription>
          Register a new tokenized equity symbol with its on-chain proxy address.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 max-w-lg" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <label htmlFor="symbol-ticker" className="text-sm font-medium">
              Ticker
            </label>
            <Input
              id="symbol-ticker"
              placeholder="AAPL"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="symbol-proxy-addr" className="text-sm font-medium">
              Token Proxy Address (EVM)
            </label>
            <Input
              id="symbol-proxy-addr"
              placeholder="0xdAC17F958D2ee523a2206206994597C13D831ec7"
              value={tokenProxyAddr}
              onChange={(e) => setTokenProxyAddr(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              On-chain EVM proxy contract address for this tokenized equity.
            </p>
          </div>

          {message ? (
            <p
              role={message.tone === "error" ? "alert" : "status"}
              className={
                message.tone === "success" ? "text-sm text-emerald-600" : "text-sm text-destructive"
              }
            >
              {message.text}
            </p>
          ) : null}

          <Button type="submit" disabled={!canSubmit}>
            {isLoading ? "Onboarding…" : "Onboard symbol"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function SymbolsView() {
  return (
    <section className="mx-auto grid w-full max-w-[1500px] gap-5">
      <header>
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Administration
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Symbols</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage tokenized equity symbols, their on-chain addresses, and trading status.
        </p>
      </header>

      <SymbolsTable />
      <OnboardSymbolForm />
    </section>
  );
}
