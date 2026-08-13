"use client";

import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, ChevronDown } from "lucide-react";
import { formatDate } from "@/lib/utils/formatters";
import {
  useCreateDepositMutation,
  useGetDepositsQuery,
  useCreateWithdrawalMutation,
  useGetWithdrawalsQuery,
  useGetClientWalletsQuery,
} from "@/lib/api/treasuryApi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import type { ClientWallet } from "@/lib/types/treasury";

function apiErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === "object" && data !== null && "message" in data) {
      return String((data as { message: unknown }).message);
    }
  }
  return "The request could not be completed.";
}

function truncateAddress(addr: string) {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 10)}…${addr.slice(-6)}`;
}

const depositStateColors: Record<string, string> = {
  DETECTED: "bg-blue-100 text-blue-800",
  CONFIRMING: "bg-yellow-100 text-yellow-800",
  CREDITED: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
};

const withdrawalStateColors: Record<string, string> = {
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  SUBMITTING: "bg-blue-100 text-blue-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
  REJECTED: "bg-red-100 text-red-800",
};

// --- Deposit Dialog ---

function DepositDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [deposit, { isLoading }] = useCreateDepositMutation();
  const [txHash, setTxHash] = useState("");
  const [amountUsdt, setAmountUsdt] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const canSubmit = txHash.trim() && amountUsdt.trim() && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await deposit({
        clientId,
        txHash: txHash.trim(),
        amountUsdt: amountUsdt.trim(),
      }).unwrap();
      setMessage({ tone: "success", text: "Deposit created successfully." });
      setTxHash("");
      setAmountUsdt("");
      setTimeout(() => setOpen(false), 1200);
    } catch (error) {
      setMessage({ tone: "error", text: apiErrorMessage(error) });
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setTxHash("");
      setAmountUsdt("");
      setMessage(null);
    }
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <ArrowDownToLine className="size-4" />
            Deposit
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Deposit</DialogTitle>
          <DialogDescription>
            Record a USDT deposit for this client.
          </DialogDescription>
        </DialogHeader>

        <form id="client-deposit-form" className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <label htmlFor="client-deposit-txhash" className="text-sm font-medium">
              Transaction Hash
            </label>
            <Input
              id="client-deposit-txhash"
              placeholder="0x..."
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              On-chain transaction hash (0x-prefixed, 64 hex chars).
            </p>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="client-deposit-amount" className="text-sm font-medium">
              Amount (USDT)
            </label>
            <Input
              id="client-deposit-amount"
              type="number"
              min="0"
              step="0.000001"
              placeholder="5000.00"
              value={amountUsdt}
              onChange={(e) => setAmountUsdt(e.target.value)}
            />
          </div>

          {message ? (
            <p
              role={message.tone === "error" ? "alert" : "status"}
              className={message.tone === "success" ? "text-sm text-emerald-600" : "text-sm text-destructive"}
            >
              {message.text}
            </p>
          ) : null}
        </form>

        <DialogFooter showCloseButton>
          <Button type="submit" form="client-deposit-form" disabled={!canSubmit}>
            {isLoading ? "Submitting…" : "Submit Deposit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Withdrawal Dialog ---

function WithdrawalDialog({ clientId, wallets }: { clientId: string; wallets: ClientWallet[] }) {
  const [open, setOpen] = useState(false);
  const [withdraw, { isLoading }] = useCreateWithdrawalMutation();
  const [addressId, setAddressId] = useState("");
  const [amountUsdt, setAmountUsdt] = useState("");
  const [clientIdemKey, setClientIdemKey] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const canSubmit = addressId && amountUsdt.trim() && clientIdemKey.trim() && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await withdraw({
        clientId,
        addressId,
        amountUsdt: amountUsdt.trim(),
        clientIdemKey: clientIdemKey.trim(),
      }).unwrap();
      setMessage({ tone: "success", text: "Withdrawal request submitted." });
      setAddressId("");
      setAmountUsdt("");
      setClientIdemKey("");
      setTimeout(() => setOpen(false), 1200);
    } catch (error) {
      setMessage({ tone: "error", text: apiErrorMessage(error) });
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setAddressId("");
      setAmountUsdt("");
      setClientIdemKey("");
      setMessage(null);
    }
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline" className="gap-1.5">
            <ArrowUpFromLine className="size-4" />
            Withdraw
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Withdrawal</DialogTitle>
          <DialogDescription>
            Request a USDT withdrawal for this client.
          </DialogDescription>
        </DialogHeader>

        <form id="client-withdrawal-form" className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">
              Wallet Address
            </label>
            {wallets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No wallets available.</p>
            ) : (
              <Select value={addressId} onValueChange={(v) => setAddressId(String(v))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a wallet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      <span className="font-mono text-xs">{truncateAddress(w.address)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="client-withdrawal-amount" className="text-sm font-medium">
              Amount (USDT)
            </label>
            <Input
              id="client-withdrawal-amount"
              type="number"
              min="0"
              step="0.000001"
              placeholder="5000.00"
              value={amountUsdt}
              onChange={(e) => setAmountUsdt(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="client-withdrawal-idem-key" className="text-sm font-medium">
              Idempotency Key
            </label>
            <Input
              id="client-withdrawal-idem-key"
              placeholder="WDR-001"
              value={clientIdemKey}
              onChange={(e) => setClientIdemKey(e.target.value)}
            />
          </div>

          {message ? (
            <p
              role={message.tone === "error" ? "alert" : "status"}
              className={message.tone === "success" ? "text-sm text-emerald-600" : "text-sm text-destructive"}
            >
              {message.text}
            </p>
          ) : null}
        </form>

        <DialogFooter showCloseButton>
          <Button type="submit" form="client-withdrawal-form" disabled={!canSubmit}>
            {isLoading ? "Submitting…" : "Submit Withdrawal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Collapsible Section ---

function CollapsibleCard({
  title,
  description,
  defaultOpen,
  actions,
  children,
}: {
  title: string;
  description: string;
  defaultOpen: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            className="flex items-center gap-2 text-left"
            onClick={() => setOpen((v) => !v)}
          >
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                !open && "-rotate-90",
              )}
            />
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </button>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      </CardHeader>
      {open && <CardContent className="px-0">{children}</CardContent>}
    </Card>
  );
}

// --- Deposits Table ---

function DepositsSection({ clientId }: { clientId: string }) {
  const { data: deposits = [], isLoading, isError } = useGetDepositsQuery(clientId);

  return (
    <CollapsibleCard
      title="Deposits"
      description="USDT deposit history for this client."
      defaultOpen
      actions={<DepositDialog clientId={clientId} />}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Amount (USDT)</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Tx Hash</TableHead>
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
                  Deposits could not be loaded.
                </p>
              </TableCell>
            </TableRow>
          ) : deposits.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 px-4 text-center text-muted-foreground">
                No deposits yet.
              </TableCell>
            </TableRow>
          ) : (
            deposits.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="pl-4 tabular-nums font-medium">
                  {d.amountUsdt}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${depositStateColors[d.state] ?? "bg-gray-100 text-gray-800"}`}
                  >
                    {d.state}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs" title={d.txHash}>
                    {truncateAddress(d.txHash)}
                  </span>
                </TableCell>
                <TableCell className="pr-4 text-muted-foreground">
                  {formatDate(d.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </CollapsibleCard>
  );
}

// --- Withdrawals Table ---

function WithdrawalsSection({ clientId, wallets }: { clientId: string; wallets: ClientWallet[] }) {
  const { data: withdrawals = [], isLoading, isError } = useGetWithdrawalsQuery(clientId);

  const walletMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const w of wallets) {
      map.set(w.id, w.address);
    }
    return map;
  }, [wallets]);

  return (
    <CollapsibleCard
      title="Withdrawals"
      description="USDT withdrawal history for this client."
      defaultOpen={false}
      actions={<WithdrawalDialog clientId={clientId} wallets={wallets} />}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Amount (USDT)</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Wallet Address</TableHead>
            <TableHead>Idempotency Key</TableHead>
            <TableHead>Tx Hash</TableHead>
            <TableHead className="pr-4">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 3 }, (_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }, (__, j) => (
                  <TableCell key={j} className="first:pl-4 last:pr-4">
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 px-4 text-center">
                <p role="alert" className="font-medium text-destructive">
                  Withdrawals could not be loaded.
                </p>
              </TableCell>
            </TableRow>
          ) : withdrawals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 px-4 text-center text-muted-foreground">
                No withdrawals yet.
              </TableCell>
            </TableRow>
          ) : (
            withdrawals.map((w) => {
              const walletAddress = walletMap.get(w.addressId);
              return (
                <TableRow key={w.id}>
                  <TableCell className="pl-4 tabular-nums font-medium">
                    {w.amountUsdt}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${withdrawalStateColors[w.state] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {w.state}
                    </span>
                  </TableCell>
                  <TableCell>
                    {walletAddress ? (
                      <span className="font-mono text-xs" title={walletAddress}>
                        {truncateAddress(walletAddress)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{w.clientIdemKey}</TableCell>
                  <TableCell>
                    {w.txHash ? (
                      <span className="font-mono text-xs" title={w.txHash}>
                        {truncateAddress(w.txHash)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </TableCell>
                  <TableCell className="pr-4 text-muted-foreground">
                    {formatDate(w.createdAt)}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </CollapsibleCard>
  );
}

// --- Main View ---

export function ClientTreasuryView({ clientId }: { clientId: string }) {
  const { data: wallets = [] } = useGetClientWalletsQuery(clientId);

  return (
    <section className="mx-auto grid w-full max-w-[1500px] gap-5">
      <header>
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Client
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Treasury</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage deposits and withdrawals for this client.
        </p>
      </header>

      <DepositsSection clientId={clientId} />
      <WithdrawalsSection clientId={clientId} wallets={wallets} />
    </section>
  );
}
