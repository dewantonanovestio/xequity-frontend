"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useReplaceOrderMutation, useReplaceRedemptionMutation } from "@/lib/api/ordersApi";
import type { Order } from "@/lib/types/order";
import type { TimeInForce } from "@/lib/types/trade";
import { TifSelect } from "@/components/trade/TifSelect";

function withinDecimals(value: string, max: number): boolean {
  const dot = value.indexOf('.');
  return dot === -1 || value.length - dot - 1 <= max;
}

interface EditOrderModalProps {
  order: Order;
}

export function EditOrderModal({ order }: EditOrderModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [qty, setQty] = useState(String(order.qty ?? ""));
  const [limitPrice, setLimitPrice] = useState(String(order.limitPrice ?? ""));
  const [tif, setTif] = useState<TimeInForce>("DAY");
  const [error, setError] = useState<string | null>(null);
  const [replaceOrder, replaceOrderState] = useReplaceOrderMutation();
  const [replaceRedemption, replaceRedemptionState] = useReplaceRedemptionMutation();
  const isSell = order.side === "SELL";
  const replaceState = isSell ? replaceRedemptionState : replaceOrderState;
  const isFractionalQty = !Number.isInteger(order.qty);
  const isInputQtyFractional = qty !== "" && qty.includes(".");
  const isTifDisabled = isFractionalQty || isInputQtyFractional;

  const handleSubmit = async () => {
    setError(null);
    const payload = {
      id: order.id,
      ...(qty ? { qty } : {}),
      ...(limitPrice ? { limitPrice } : {}),
      tif,
    };
    try {
      if (isSell) {
        await replaceRedemption(payload).unwrap();
      } else {
        await replaceOrder(payload).unwrap();
      }
      setIsOpen(false);
    } catch (err) {
      const data =
        typeof err === "object" && err !== null && "data" in err
          ? (err as { data?: { message?: string } }).data
          : undefined;
      setError(data?.message ?? "The order could not be updated.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant="outline" size="icon" aria-label="Edit order" />}>
        <Pencil className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
            Quantity
            <Input
              type="number"
              value={qty}
              onChange={(e) => {
                if (withinDecimals(e.target.value, 9)) {
                  setQty(e.target.value);
                  if (e.target.value.includes(".")) setTif("DAY");
                }
              }}
              min="0"
              step="any"
              disabled={isFractionalQty}
            />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
            Limit Price
            <Input
              type="number"
              value={limitPrice}
              onChange={(e) => { if (withinDecimals(e.target.value, 2)) setLimitPrice(e.target.value); }}
              min="0"
              step="any"
            />
          </label>
          <TifSelect value={isTifDisabled ? "DAY" : tif} onChange={setTif} disabled={isTifDisabled} />
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            disabled={replaceState.isLoading}
            onClick={() => void handleSubmit()}
          >
            {replaceState.isLoading ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
