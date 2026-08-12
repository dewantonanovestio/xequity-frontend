"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, PlusIcon } from "lucide-react";
import { formatDate } from "@/lib/utils/formatters";
import { useGetClientsQuery, useOnboardClientMutation } from "@/lib/api/clientApi";
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy address"}
      className="ml-1.5 inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? <CheckIcon className="size-3 text-emerald-600" /> : <CopyIcon className="size-3" />}
    </button>
  );
}

function ClientsTable() {
  const { data: clients = [], isLoading, isError } = useGetClientsQuery();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>All Clients</CardTitle>
            <CardDescription className="mt-1">
              Registered clients with their spread configuration and deposit address.
            </CardDescription>
          </div>
          <OnboardClientDialog />
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Legal Name</TableHead>
              <TableHead>Buy Spread (bps)</TableHead>
              <TableHead>Sell Spread (bps)</TableHead>
              <TableHead>Deposit Address</TableHead>
              <TableHead className="pr-4">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }, (_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }, (__, j) => (
                    <TableCell key={j} className="first:pl-4 last:pr-4">
                      <Skeleton className="h-5 w-28" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 px-4 text-center">
                  <p role="alert" className="font-medium text-destructive">
                    Clients could not be loaded.
                  </p>
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 px-4 text-center text-muted-foreground">
                  No clients onboarded yet.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="pl-4 font-medium">{client.legalName}</TableCell>
                  <TableCell className="tabular-nums">{client.buySpreadBps}</TableCell>
                  <TableCell className="tabular-nums">{client.sellSpreadBps}</TableCell>
                  <TableCell>
                    {client.depositAddress ? (
                      <span className="inline-flex items-center">
                        <span className="font-mono text-xs" title={client.depositAddress}>
                          {client.depositAddress.slice(0, 10)}…{client.depositAddress.slice(-6)}
                        </span>
                        <CopyButton text={client.depositAddress} />
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="pr-4 text-muted-foreground">
                    {formatDate(client.createdAt)}
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

function OnboardClientDialog() {
  const [open, setOpen] = useState(false);
  const [onboard, { isLoading }] = useOnboardClientMutation();
  const [legalName, setLegalName] = useState("");
  const [buySpreadBps, setBuySpreadBps] = useState("");
  const [sellSpreadBps, setSellSpreadBps] = useState("");
  const [depositAddress, setDepositAddress] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const canSubmit =
    legalName.trim() &&
    buySpreadBps.trim() &&
    sellSpreadBps.trim() &&
    depositAddress.trim() &&
    !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const result = await onboard({
        legalName: legalName.trim(),
        buySpreadBps: parseInt(buySpreadBps, 10),
        sellSpreadBps: parseInt(sellSpreadBps, 10),
        depositAddress: depositAddress.trim(),
      }).unwrap();
      setMessage({ tone: "success", text: `Client "${result.legalName}" onboarded successfully.` });
      setLegalName("");
      setBuySpreadBps("");
      setSellSpreadBps("");
      setDepositAddress("");
      setTimeout(() => setOpen(false), 1200);
    } catch (error) {
      setMessage({ tone: "error", text: apiErrorMessage(error) });
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setLegalName("");
      setBuySpreadBps("");
      setSellSpreadBps("");
      setDepositAddress("");
      setMessage(null);
    }
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <PlusIcon className="size-4" />
            Onboard new client
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Onboard New Client</DialogTitle>
          <DialogDescription>
            Register a new client with their spread configuration and USDT deposit address.
          </DialogDescription>
        </DialogHeader>

        <form id="onboard-client-form" className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <label htmlFor="client-legal-name" className="text-sm font-medium">
              Legal Name
            </label>
            <Input
              id="client-legal-name"
              placeholder="Nanovest Pte Ltd"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <label htmlFor="client-buy-spread" className="text-sm font-medium">
                Buy Spread (bps)
              </label>
              <Input
                id="client-buy-spread"
                type="number"
                min="0"
                max="10000"
                step="1"
                placeholder="50"
                value={buySpreadBps}
                onChange={(e) => setBuySpreadBps(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="client-sell-spread" className="text-sm font-medium">
                Sell Spread (bps)
              </label>
              <Input
                id="client-sell-spread"
                type="number"
                min="0"
                max="10000"
                step="1"
                placeholder="50"
                value={sellSpreadBps}
                onChange={(e) => setSellSpreadBps(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="client-deposit-address" className="text-sm font-medium">
              USDT Deposit Address (EVM)
            </label>
            <Input
              id="client-deposit-address"
              placeholder="0xdAC17F958D2ee523a2206206994597C13D831ec7"
              value={depositAddress}
              onChange={(e) => setDepositAddress(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              On-chain EVM address where the client will send USDT deposits.
            </p>
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
          <Button type="submit" form="onboard-client-form" disabled={!canSubmit}>
            {isLoading ? "Onboarding…" : "Onboard client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ClientsView() {
  return (
    <section className="mx-auto grid w-full max-w-[1500px] gap-5">
      <header>
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Administration
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Clients</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage client onboarding, spread configuration, and deposit addresses.
        </p>
      </header>

      <ClientsTable />
    </section>
  );
}
