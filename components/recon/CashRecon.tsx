"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRunCashReconMutation } from "@/lib/api/reconApi";
import { getDeltaTone } from "@/lib/recon/reconUtils";
import type { CashRecon as CashReconData } from "@/lib/types/recon";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";

interface CashReconProps {
  cash: CashReconData | null;
  isLoading: boolean;
  isError: boolean;
}

interface Feedback {
  tone: "success" | "error";
  message: string;
}

function mutationErrorMessage(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return "The cash reconciliation run could not be started.";
  }

  const data = "data" in error ? error.data : undefined;
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    return data.message;
  }

  return "The cash reconciliation run could not be started.";
}

function CashField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background/60 p-4">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-base font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

export function CashRecon({ cash, isLoading, isError }: CashReconProps) {
  const [runCashRecon] = useRunCashReconMutation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | undefined>();

  const executeRun = async () => {
    setIsSubmitting(true);
    setFeedback(undefined);

    try {
      await runCashRecon().unwrap();
      setIsOpen(false);
      setFeedback({
        tone: "success",
        message: "Cash reconciliation run triggered.",
      });
    } catch (error) {
      setIsOpen(false);
      setFeedback({ tone: "error", message: mutationErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tone = cash ? getDeltaTone(cash.usdtDelta) : "balanced";
  const deltaClasses =
    tone === "balanced"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
      : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200";
  const indicatorClass = tone === "balanced" ? "bg-emerald-500" : "bg-red-500";
  const usesBackendContract = cash?.source === "backend";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Reconciliation</CardTitle>
        <CardDescription>
          Ledger, wallet, and brokerage cash alignment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                data-testid="cash-field-skeleton"
                className="rounded-lg border p-4"
              >
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-3 h-6 w-24" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <p role="alert" className="rounded-lg bg-destructive/5 p-4 font-medium text-destructive">
            Cash reconciliation could not be loaded.
          </p>
        ) : cash === null ? (
          <p className="rounded-lg border p-6 text-center text-muted-foreground">
            No cash reconciliation result is available.
          </p>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <CashField
              label={
                usesBackendContract
                  ? "Internal Net Obligation"
                  : "USDT Ledger Total"
              }
              value={formatCurrency(cash.usdtLedgerTotal)}
            />
            <CashField
              label={usesBackendContract ? "Alpaca Deficit" : "USDT Wallet Balance"}
              value={formatCurrency(cash.usdtWalletBalance)}
            />
            <div
              data-testid="cash-delta"
              data-tone={tone}
              className={`rounded-lg border p-4 ${deltaClasses}`}
            >
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase">
                <span
                  data-testid="cash-delta-indicator"
                  aria-hidden="true"
                  className={`size-2.5 rounded-full ${indicatorClass}`}
                />
                {usesBackendContract ? "Net Settlement Difference" : "Delta"}
              </dt>
              <dd className="mt-1 text-xl font-bold tabular-nums">
                {formatCurrency(cash.usdtDelta)}
              </dd>
            </div>
            <CashField
              label={usesBackendContract ? "Buy Fills Total" : "USD Float at Alpaca"}
              value={formatCurrency(cash.usdFloatAtAlpaca)}
            />
            <CashField
              label={
                usesBackendContract
                  ? "Sell Proceeds Total"
                  : "Projected Float Requirement"
              }
              value={formatCurrency(cash.projectedFloatRequirement)}
            />
            <CashField
              label="Last Recon Run"
              value={formatDate(cash.lastRunAt)}
            />
          </dl>
        )}
      </CardContent>
      <CardFooter className="flex-wrap justify-between gap-3">
        {feedback ? (
          <p
            role={feedback.tone === "error" ? "alert" : "status"}
            className={
              feedback.tone === "error"
                ? "text-sm text-destructive"
                : "text-sm text-emerald-700 dark:text-emerald-300"
            }
          >
            {feedback.message}
          </p>
        ) : (
          <span />
        )}

        <AlertDialog
          open={isOpen}
          onOpenChange={(open) => {
            if (isSubmitting) return;
            if (open) setFeedback(undefined);
            setIsOpen(open);
          }}
        >
          <AlertDialogTrigger render={<Button disabled={isSubmitting} />}>
            Run Recon Now
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Run cash reconciliation?</AlertDialogTitle>
              <AlertDialogDescription>
                This will trigger a full cash reconciliation run. Continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isSubmitting}
                onClick={(event) => {
                  event.preventDefault();
                  void executeRun();
                }}
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle
                      data-testid="recon-run-spinner"
                      aria-hidden="true"
                      className="animate-spin"
                    />
                    Running…
                  </>
                ) : (
                  "Run Recon Now"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
