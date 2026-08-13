"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils/formatters";
import {
  useAlpacaDepositMutation,
  useCreateWireWithdrawalMutation,
  useGetWithdrawalBankConfigQuery,
  useGetWireWithdrawalsQuery,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function apiErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === "object" && data !== null && "message" in data) {
      return String((data as { message: unknown }).message);
    }
  }
  return "The request could not be completed.";
}

const bankFieldLabels: Record<string, string> = {
  alpacaBankId: "Alpaca Bank ID",
  name: "Account Name",
  bankCode: "Bank Code",
  bankCodeType: "Bank Code Type",
  accountNumber: "Account Number",
  status: "Status",
  streetAddress: "Street Address",
  city: "City",
  stateProvince: "State / Province",
  postalCode: "Postal Code",
  country: "Country",
};

function BankInfoCard() {
  const { data: config, isLoading, isError } = useGetWithdrawalBankConfigQuery();

  let bankData: Record<string, unknown> | null = null;
  if (config?.value) {
    try {
      bankData = JSON.parse(config.value);
    } catch {
      bankData = null;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recipient Bank Info</CardTitle>
        <CardDescription>
          Wire withdrawal recipient bank configuration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-56" />
          </div>
        ) : isError ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            Bank configuration could not be loaded.
          </p>
        ) : bankData ? (
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(bankFieldLabels).map(([key, label]) => {
              const raw = bankData[key];
              const value =
                raw != null && typeof raw !== "object" && String(raw).trim()
                  ? String(raw)
                  : "–";

              return (
                <div key={key}>
                  <dt className="text-xs font-medium text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium">{value}</dd>
                </div>
              );
            })}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">No bank configuration found.</p>
        )}
      </CardContent>
    </Card>
  );
}

function DepositDialog() {
  const [open, setOpen] = useState(false);
  const [deposit, { isLoading }] = useAlpacaDepositMutation();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const canSubmit = amount.trim() && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await deposit({ amount: parseFloat(amount) }).unwrap();
      setMessage({ tone: "success", text: "Deposit submitted successfully." });
      setAmount("");
      setTimeout(() => setOpen(false), 1200);
    } catch (error) {
      setMessage({ tone: "error", text: apiErrorMessage(error) });
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setAmount("");
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
          <DialogTitle>Deposit to Alpaca</DialogTitle>
          <DialogDescription>
            Submit a wire deposit to the Alpaca trading account.
          </DialogDescription>
        </DialogHeader>

        <form id="deposit-form" className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <label htmlFor="deposit-amount" className="text-sm font-medium">
              Amount (USD)
            </label>
            <Input
              id="deposit-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="10000.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
          <Button type="submit" form="deposit-form" disabled={!canSubmit}>
            {isLoading ? "Submitting…" : "Submit Deposit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WithdrawalDialog() {
  const [open, setOpen] = useState(false);
  const [withdraw, { isLoading }] = useCreateWireWithdrawalMutation();
  const [amount, setAmount] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const canSubmit = amount.trim() && idempotencyKey.trim() && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await withdraw({
        amount: amount.trim(),
        idempotencyKey: idempotencyKey.trim(),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      }).unwrap();
      setMessage({ tone: "success", text: "Withdrawal submitted successfully." });
      setAmount("");
      setIdempotencyKey("");
      setNotes("");
      setTimeout(() => setOpen(false), 1200);
    } catch (error) {
      setMessage({ tone: "error", text: apiErrorMessage(error) });
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setAmount("");
      setIdempotencyKey("");
      setNotes("");
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
          <DialogTitle>Admin Withdrawal</DialogTitle>
          <DialogDescription>
            Submit an admin withdrawal request.
          </DialogDescription>
        </DialogHeader>

        <form id="withdrawal-form" className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <label htmlFor="withdrawal-amount" className="text-sm font-medium">
              Amount (USD)
            </label>
            <Input
              id="withdrawal-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="10000.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="withdrawal-idempotency-key" className="text-sm font-medium">
              Idempotency Key
            </label>
            <Input
              id="withdrawal-idempotency-key"
              placeholder="WIRE-2026-08-13-001"
              value={idempotencyKey}
              onChange={(e) => setIdempotencyKey(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="withdrawal-notes" className="text-sm font-medium">
              Notes
            </label>
            <Input
              id="withdrawal-notes"
              placeholder="Reason for withdrawal"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
          <Button type="submit" form="withdrawal-form" disabled={!canSubmit}>
            {isLoading ? "Submitting…" : "Submit Withdrawal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const stateColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  COMPLETE: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELED: "bg-gray-100 text-gray-800",
  RETURNED: "bg-orange-100 text-orange-800",
  LEDGER_POSTED: "bg-emerald-100 text-emerald-800",
};

function WithdrawalsTable() {
  const { data: withdrawals = [], isLoading, isError } = useGetWireWithdrawalsQuery();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Withdrawals</CardTitle>
            <CardDescription className="mt-1">
              History of admin wire withdrawal requests.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <DepositDialog />
            <WithdrawalDialog />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Amount</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Idempotency Key</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="pr-4">Completed</TableHead>
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
              withdrawals.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="pl-4 tabular-nums font-medium">
                    {formatCurrency(parseFloat(w.amount))}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${stateColors[w.state] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {w.state}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{w.idempotencyKey}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{w.notes || "–"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {w.submittedAt ? formatDate(w.submittedAt) : "–"}
                  </TableCell>
                  <TableCell className="pr-4 text-muted-foreground">
                    {w.completedAt ? formatDate(w.completedAt) : "–"}
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

export function TreasuryView() {
  return (
    <section className="mx-auto grid w-full max-w-[1500px] gap-5">
      <header>
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Administration
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Treasury</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage deposits, withdrawals, and bank configuration.
        </p>
      </header>

      <BankInfoCard />
      <WithdrawalsTable />
    </section>
  );
}
