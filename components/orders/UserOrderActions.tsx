"use client";

import { useState } from "react";
import { X } from "lucide-react";

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
import { useCancelOrderMutation, useCancelRedemptionMutation } from "@/lib/api/ordersApi";
import { EditOrderModal } from "@/components/orders/EditOrderModal";
import type { Order } from "@/lib/types/order";

interface UserOrderActionsProps {
  order: Order;
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

export function UserOrderActions({ order }: UserOrderActionsProps) {
  const [cancelOrder, cancelOrderState] = useCancelOrderMutation();
  const [cancelRedemption, cancelRedemptionState] = useCancelRedemptionMutation();
  const isSell = order.side === "SELL";
  const cancelState = isSell ? cancelRedemptionState : cancelOrderState;
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<
    { tone: "success" | "error"; message: string } | undefined
  >();

  const isCancellable =
    order.side === "BUY"
      ? ["QUEUED", "OPEN_EXECUTING", "PARTIALLY_FILLED"].includes(order.state)
      : ["SUBMITTED", "VALIDATED", "LOCKING", "LOCKED", "SELLING", "PARTIALLY_FILLED"].includes(order.state);

  const isEditable =
    order.side === "BUY"
      ? order.type === "LIMIT" && ["OPEN_EXECUTING", "PARTIALLY_FILLED"].includes(order.state)
      : ["SUBMITTED", "VALIDATED", "LOCKING", "LOCKED", "SELLING", "PARTIALLY_FILLED"].includes(order.state);

  if (!isCancellable && !isEditable) {
    return null;
  }

  const execute = async () => {
    setFeedback(undefined);

    try {
      await (isSell ? cancelRedemption(order.id) : cancelOrder(order.id)).unwrap();
      setIsOpen(false);
      setFeedback({
        tone: "success",
        message: "Cancel Order completed successfully.",
      });
    } catch (error) {
      setIsOpen(false);
      setFeedback({ tone: "error", message: readErrorMessage(error) });
    }
  };

  return (
    <div data-testid="user-order-actions" className="flex flex-row items-center gap-1">
      {isEditable && <EditOrderModal order={order} />}
      <AlertDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (open) setFeedback(undefined);
          setIsOpen(open);
        }}
      >
        <AlertDialogTrigger
          render={<Button variant="destructive" size="icon" aria-label="Cancel order" />}
        >
          <X className="size-4" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Cancel Order</AlertDialogTitle>
            <AlertDialogDescription>
              {`This will cancel ${order.id}. Any unexecuted quantity will no longer be eligible for execution.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelState.isLoading}>
              Keep current state
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={cancelState.isLoading}
              onClick={() => void execute()}
            >
              {cancelState.isLoading ? "Working…" : "Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {feedback ? <FeedbackMessage feedback={feedback} /> : null}
    </div>
  );
}
