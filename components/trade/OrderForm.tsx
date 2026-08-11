"use client";

import { useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

import { CollarPriceInput } from "@/components/trade/CollarPriceInput";
import { ExtendedHoursToggle } from "@/components/trade/ExtendedHoursToggle";
import { OrderTypeToggle } from "@/components/trade/OrderTypeToggle";
import { QtyNotionalToggle } from "@/components/trade/QtyNotionalToggle";
import { SymbolSelect } from "@/components/trade/SymbolSelect";
import { TifSelect } from "@/components/trade/TifSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlaceOrderMutation, usePlaceRedemptionMutation } from "@/lib/api/ordersApi";
import { useGetSymbolsQuery } from "@/lib/api/userApi";
import { useAppSelector } from "@/lib/store/hooks";
import { selectSelectedEndUser } from "@/lib/store/viewModeSlice";
import { buildPlaceOrderRequest, buildPlaceRedemptionRequest, validateTradeForm } from "@/lib/trade/tradeUtils";
import type { OrderType } from "@/lib/types/order";
import type { InputMode, TimeInForce, TradeFormValues } from "@/lib/types/trade";

function apiErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === "object" && data !== null && "message" in data) {
      return String((data as { message: unknown }).message);
    }
  }
  return "The order could not be submitted.";
}

export function OrderForm() {
  const user = useAppSelector(selectSelectedEndUser);
  const symbolsQuery = useGetSymbolsQuery();
  const [placeOrder, placeOrderState] = usePlaceOrderMutation();
  const [placeRedemption, placeRedemptionState] = usePlaceRedemptionMutation();
  const searchParams = useSearchParams();
  const [side, setSide] = useState<"BUY" | "SELL">(() =>
    searchParams.get("side") === "SELL" ? "SELL" : "BUY"
  );
  const [symbol, setSymbol] = useState(() => searchParams.get("symbol") ?? "");
  const [type, setType] = useState<OrderType>("MARKET");
  const [inputMode, setInputMode] = useState<InputMode>("qty");
  const [amount, setAmount] = useState(() => searchParams.get("qty") ?? "");
  const [limitPrice, setLimitPrice] = useState("");
  const [collarPrice, setCollarPrice] = useState("");
  const [tif, setTif] = useState<TimeInForce>("DAY");
  const [extendedHours, setExtendedHours] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const submittingRef = useRef(false);

  if (!user) {
    return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Select an end-user in the sidebar to place an order.</div>;
  }

  const isSell = side === "SELL";
  const isLoading = placeOrderState.isLoading || placeRedemptionState.isLoading;

  const handleExtendedHoursChange = (checked: boolean) => {
    setExtendedHours(checked);
    if (checked) setType("LIMIT");
  };

  const values: TradeFormValues = {
    symbol,
    side,
    type,
    ...(isSell ? { qty: amount } : inputMode === "qty" ? { qty: amount } : { notional: amount }),
    ...(type === "LIMIT" ? { limitPrice, collarPrice } : {}),
    tif,
    extendedHours,
  };

  const validationError = isSell
    ? (!symbol ? "Select a symbol." : !amount.trim() ? "Enter a quantity to sell." : null)
    : validateTradeForm(values);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (validationError || submittingRef.current) return;
    submittingRef.current = true;
    setMessage(null);
    try {
      if (isSell) {
        await placeRedemption(buildPlaceRedemptionRequest(values, user)).unwrap();
        setMessage({ tone: "success", text: "Sell order submitted successfully." });
      } else {
        await placeOrder(buildPlaceOrderRequest(values, user)).unwrap();
        setMessage({ tone: "success", text: "Buy order submitted successfully." });
      }
      setAmount("");
    } catch (error) {
      setMessage({ tone: "error", text: apiErrorMessage(error) });
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Place order</CardTitle>
        <CardDescription>Trading as {user.displayName}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={submit}>
          <Tabs value={side} onValueChange={(v) => { setSide(v as "BUY" | "SELL"); setAmount(""); setMessage(null); }}>
            <TabsList className="w-full">
              <TabsTrigger value="BUY" className="flex-1">Buy</TabsTrigger>
              <TabsTrigger value="SELL" className="flex-1">Sell</TabsTrigger>
            </TabsList>
          </Tabs>
          <SymbolSelect symbols={symbolsQuery.data ?? []} value={symbol} onChange={setSymbol} />
          <OrderTypeToggle value={type} onChange={setType} disabled={extendedHours} />
          <ExtendedHoursToggle checked={extendedHours} onChange={handleExtendedHoursChange} />
          {isSell ? (
            <QtyNotionalToggle mode="qty" value={amount} onModeChange={() => {}} onValueChange={setAmount} />
          ) : (
            <QtyNotionalToggle mode={inputMode} value={amount} onModeChange={(next) => { setInputMode(next); setAmount(""); }} onValueChange={setAmount} />
          )}
          {type === "LIMIT" ? <CollarPriceInput limitPrice={limitPrice} collarPrice={collarPrice} onLimitPriceChange={setLimitPrice} onCollarPriceChange={setCollarPrice} /> : null}
          <TifSelect value={tif} onChange={setTif} />
          {message ? <p role={message.tone === "error" ? "alert" : "status"} className={message.tone === "success" ? "text-sm text-emerald-600" : "text-sm text-destructive"}>{message.text}</p> : null}
          <Button type="submit" size="lg" disabled={Boolean(validationError) || isLoading || symbolsQuery.isLoading}>
            {isLoading ? "Submitting…" : isSell ? "Place sell order" : "Place buy order"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
