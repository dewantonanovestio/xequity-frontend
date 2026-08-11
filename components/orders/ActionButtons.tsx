"use client";

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
  useCancelOrderMutation,
  useRetryBurnMutation,
  useRetryMintMutation,
} from "@/lib/api/ordersApi";
import type { Order } from "@/lib/types/order";

interface ActionButtonsProps {
  order: Order;
}

interface ActionConfig {
  label: string;
  description: string;
  run: () => Promise<unknown>;
  destructive?: boolean;
  isLoading: boolean;
}

function readErrorMessage(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return "The action could not be completed.";
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

  if ("message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "The action could not be completed.";
}

function FeedbackMessage({
  feedback,
}: {
  feedback: { tone: "success" | "error"; message: string };
}) {
  return (
    <p
      role={feedback.tone === "error" ? "alert" : "status"}
      className={
        feedback.tone === "error"
          ? "max-w-72 text-right text-xs text-destructive"
          : "max-w-72 text-right text-xs text-emerald-700 dark:text-emerald-300"
      }
    >
      {feedback.message}
    </p>
  );
}

export function ActionButtons({ order }: ActionButtonsProps) {
  const [retryMint, retryMintState] = useRetryMintMutation();
  const [retryBurn, retryBurnState] = useRetryBurnMutation();
  const [cancelOrder, cancelState] = useCancelOrderMutation();
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<
    { tone: "success" | "error"; message: string } | undefined
  >();

  let action: ActionConfig | undefined;

  if (order.side === "BUY" && order.state === "MINT_FAILED") {
    action = {
      label: "Retry Mint",
      description: `This will retry the on-chain mint for ${order.id}. Confirm that the previous transaction is not recoverable before continuing.`,
      run: () => retryMint(order.id).unwrap(),
      isLoading: retryMintState.isLoading,
    };
  } else if (order.side === "SELL" && order.state === "BURN_FAILED") {
    action = {
      label: "Retry Burn",
      description: `This will retry the on-chain burn for ${order.id} and resume redemption settlement.`,
      run: () => retryBurn(order.id).unwrap(),
      isLoading: retryBurnState.isLoading,
    };
  } else if (
    order.side === "BUY" &&
    ["QUEUED", "OPEN_EXECUTING", "PARTIALLY_FILLED"].includes(order.state)
  ) {
    action = {
      label: "Cancel Order",
      description: `This will cancel ${order.id}. Any unexecuted quantity will no longer be eligible for execution.`,
      run: () => cancelOrder(order.id).unwrap(),
      destructive: true,
      isLoading: cancelState.isLoading,
    };
  }

  if (!action) {
    return feedback ? (
      <div data-testid="order-actions" className="flex justify-end">
        <FeedbackMessage feedback={feedback} />
      </div>
    ) : null;
  }

  const selectedAction = action;
  const execute = async () => {
    setFeedback(undefined);

    try {
      await selectedAction.run();
      setIsOpen(false);
      setFeedback({
        tone: "success",
        message: `${selectedAction.label} completed successfully.`,
      });
    } catch (error) {
      setIsOpen(false);
      setFeedback({ tone: "error", message: readErrorMessage(error) });
    }
  };

  return (
    <div data-testid="order-actions" className="flex flex-col items-end gap-2">
      <AlertDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (open) setFeedback(undefined);
          setIsOpen(open);
        }}
      >
        <AlertDialogTrigger
          render={
            <Button
              variant={selectedAction.destructive ? "destructive" : "default"}
            />
          }
        >
          {selectedAction.label}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {selectedAction.label}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAction.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={selectedAction.isLoading}>
              Keep current state
            </AlertDialogCancel>
            <AlertDialogAction
              variant={selectedAction.destructive ? "destructive" : "default"}
              disabled={selectedAction.isLoading}
              onClick={() => void execute()}
            >
              {selectedAction.isLoading ? "Working…" : selectedAction.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {feedback ? <FeedbackMessage feedback={feedback} /> : null}
    </div>
  );
}
