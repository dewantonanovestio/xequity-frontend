"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";

import { CollarPriceInput } from "@/components/trade/CollarPriceInput";
import { ExtendedHoursToggle } from "@/components/trade/ExtendedHoursToggle";
import { OrderTypeToggle } from "@/components/trade/OrderTypeToggle";
import { SymbolSelect } from "@/components/trade/SymbolSelect";
import { PriceQuoteCard } from "@/components/orders/PriceQuoteCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlaceOrderMutation, usePlaceRedemptionMutation } from "@/lib/api/ordersApi";
import { useGetEndUsersQuery, useGetSymbolsQuery } from "@/lib/api/userApi";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { selectEndUser, selectSelectedEndUser } from "@/lib/store/viewModeSlice";
import { generateIdemKey, validateTradeForm } from "@/lib/trade/tradeUtils";
import type { OrderType } from "@/lib/types/order";
import type { SymbolMeta } from "@/lib/types/user";
import type { InputMode, TimeInForce, TradeFormValues } from "@/lib/types/trade";

const CLIENT_TIF_OPTIONS: TimeInForce[] = ["DAY", "GTC"];

function withinDecimals(value: string, max: number): boolean {
  const dot = value.indexOf(".");
  return dot === -1 || value.length - dot - 1 <= max;
}

function apiErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === "object" && data !== null && "message" in data) {
      return String((data as { message: unknown }).message);
    }
  }
  return "The order could not be submitted.";
}

function SymbolDetail({ meta }: { meta: SymbolMeta }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
      <span className="text-muted-foreground">Fractionable</span>
      <span>{meta.fractionable ? "Yes" : "No"}</span>
      <span className="text-muted-foreground">Extended hours</span>
      <span>{meta.tradableOvernight ? "Supported" : "Not supported"}</span>
    </div>
  );
}

interface ClientOrderFormProps {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  selectedEndUserId: string;
  onEndUserChange: (id: string) => void;
}

export function ClientOrderForm({
  symbol,
  onSymbolChange,
  selectedEndUserId,
  onEndUserChange,
}: ClientOrderFormProps) {
  const dispatch = useAppDispatch();
  const { clientId } = useParams<{ clientId: string }>();
  const selectedUser = useAppSelector(selectSelectedEndUser);
  const endUsersQuery = useGetEndUsersQuery({ clientId });
  const symbolsQuery = useGetSymbolsQuery();
  const [placeOrder, placeOrderState] = usePlaceOrderMutation();
  const [placeRedemption, placeRedemptionState] = usePlaceRedemptionMutation();

  // Sync the URL-driven selectedEndUserId into Redux so submit logic can use it
  useEffect(() => {
    if (selectedEndUserId && endUsersQuery.data) {
      const user = endUsersQuery.data.find((u) => u.endUserId === selectedEndUserId);
      if (user && user.endUserId !== selectedUser?.endUserId) {
        dispatch(selectEndUser(user));
      }
    }
  }, [selectedEndUserId, endUsersQuery.data, selectedUser?.endUserId, dispatch]);

  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [type, setType] = useState<OrderType>("MARKET");
  const [inputMode, setInputMode] = useState<InputMode>("qty");
  const [amount, setAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [collarPrice, setCollarPrice] = useState("");
  const [tif, setTif] = useState<TimeInForce>("DAY");
  const [extendedHours, setExtendedHours] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const submittingRef = useRef(false);

  const isSell = side === "SELL";
  const isLoading = placeOrderState.isLoading || placeRedemptionState.isLoading;

  const selectedSymbol: SymbolMeta | null =
    symbolsQuery.data?.find((s) => s.ticker === symbol) ?? null;
  const extendedHoursDisabled = selectedSymbol
    ? !selectedSymbol.tradableOvernight
    : false;

  const handleSymbolChange = (newSymbol: string) => {
    onSymbolChange(newSymbol);
    const meta = symbolsQuery.data?.find((s) => s.ticker === newSymbol);
    if (meta && !meta.tradableOvernight && extendedHours) {
      setExtendedHours(false);
      if (type === "LIMIT") setType("MARKET");
    }
  };

  const handleExtendedHoursChange = (checked: boolean) => {
    setExtendedHours(checked);
    if (checked) setType("LIMIT");
  };

  const handleUserChange = (endUserId: string | null) => {
    if (!endUserId) return;
    onEndUserChange(endUserId);
    const user = endUsersQuery.data?.find((u) => u.endUserId === endUserId);
    if (user) dispatch(selectEndUser(user));
  };

  const handleSideChange = (nextSide: "BUY" | "SELL") => {
    setSide(nextSide);
    setAmount("");
    setMessage(null);
    if (nextSide === "SELL") {
      setInputMode("qty");
      setCollarPrice("");
    }
  };

  const values: TradeFormValues = {
    symbol,
    side,
    type,
    ...(isSell
      ? { qty: amount }
      : inputMode === "qty"
        ? { qty: amount }
        : { notional: amount }),
    ...(type === "LIMIT" ? { limitPrice } : {}),
    tif,
    extendedHours,
  };

  const validationError = isSell
    ? !symbol
      ? "Select a symbol."
      : !amount.trim()
        ? "Enter a quantity to sell."
        : null
    : validateTradeForm(values);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedUser || validationError || submittingRef.current) return;
    submittingRef.current = true;
    setMessage(null);
    try {
      if (isSell) {
        await placeRedemption({
          symbol,
          endUserId: selectedUser.endUserId,
          clientId: selectedUser.clientId,
          clientIdemKey: generateIdemKey(),
          qty: amount,
          type,
          tif,
          ...(type === "LIMIT" && limitPrice ? { limitPrice } : {}),
          ...(extendedHours ? { extendedHours: true } : {}),
        }).unwrap();
        setMessage({ tone: "success", text: "Sell order submitted." });
      } else {
        await placeOrder({
          symbol,
          side: "BUY",
          type,
          ...(inputMode === "qty" ? { qty: amount } : { notional: amount }),
          ...(type === "LIMIT" && limitPrice ? { limitPrice } : {}),
          ...(type === "MARKET" && collarPrice ? { collarPrice } : {}),
          tif,
          clientId: selectedUser.clientId,
          endUserId: selectedUser.endUserId,
          clientIdemKey: generateIdemKey(),
          ...(extendedHours ? { extendedHours: true } : {}),
        }).unwrap();
        setMessage({ tone: "success", text: "Buy order submitted." });
      }
      setAmount("");
      setCollarPrice("");
      setLimitPrice("");
    } catch (error) {
      setMessage({ tone: "error", text: apiErrorMessage(error) });
    } finally {
      submittingRef.current = false;
    }
  };

  const activeUser = selectedEndUserId
    ? endUsersQuery.data?.find((u) => u.endUserId === selectedEndUserId)
    : null;

  const endUserDisplayName = activeUser
    ? activeUser.externalId !== activeUser.displayName
      ? `${activeUser.externalId} — ${activeUser.displayName}`
      : activeUser.externalId
    : null;

  return (
    <form className="grid gap-5" onSubmit={submit}>
      {/* End-user selector */}
      <div className="grid gap-1.5">
        <label className="text-sm font-medium" htmlFor="client-order-end-user">
          End-user
        </label>
        <Select
          value={selectedEndUserId || ""}
          onValueChange={handleUserChange}
          disabled={endUsersQuery.isLoading}
        >
          <SelectTrigger id="client-order-end-user">
            <SelectValue>
              {endUserDisplayName ??
                (endUsersQuery.isLoading ? "Loading…" : "Select end-user")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(endUsersQuery.data ?? []).map((user) => (
              <SelectItem key={user.endUserId} value={user.endUserId}>
                {user.externalId !== user.displayName
                  ? `${user.externalId} — ${user.displayName}`
                  : user.externalId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Side toggle */}
      <Tabs value={side} onValueChange={(v) => handleSideChange(v as "BUY" | "SELL")}>
        <TabsList className="w-full">
          <TabsTrigger value="BUY" className="flex-1">Buy</TabsTrigger>
          <TabsTrigger value="SELL" className="flex-1">Sell</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Symbol */}
      <SymbolSelect
        symbols={symbolsQuery.data ?? []}
        value={symbol}
        onChange={handleSymbolChange}
      />

      {/* Symbol capabilities */}
      {selectedSymbol ? <SymbolDetail meta={selectedSymbol} /> : null}

      {/* Order type */}
      <OrderTypeToggle
        value={type}
        onChange={setType}
        disabled={extendedHours}
      />

      {/* Extended hours */}
      <ExtendedHoursToggle
        checked={extendedHours}
        onChange={handleExtendedHoursChange}
        disabled={extendedHoursDisabled}
        showOvernightWarning={extendedHoursDisabled}
      />

      {/* Amount input */}
      {isSell ? (
        /* Sell: qty only, no notional toggle */
        <div className="grid gap-1.5">
          <label htmlFor="trade-amount" className="text-xs font-medium text-muted-foreground">
            Quantity
          </label>
          <Input
            id="trade-amount"
            type="number"
            min="0"
            step="any"
            value={amount}
            placeholder="10"
            onChange={(e) => {
              if (withinDecimals(e.target.value, 9)) setAmount(e.target.value);
            }}
          />
        </div>
      ) : (
        /* Buy: qty or notional toggle */
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="trade-amount" className="text-xs font-medium text-muted-foreground">
              {inputMode === "qty" ? "Quantity" : "Dollar amount"}
            </label>
            <div className="flex gap-1">
              {(["qty", "notional"] as const).map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="xs"
                  variant={inputMode === option ? "secondary" : "ghost"}
                  onClick={() => { setInputMode(option); setAmount(""); }}
                >
                  {option === "qty" ? "Qty" : "Notional"}
                </Button>
              ))}
            </div>
          </div>
          <Input
            id="trade-amount"
            type="number"
            min="0"
            step="any"
            value={amount}
            placeholder={inputMode === "qty" ? "10" : "1000.00"}
            onChange={(e) => {
              if (withinDecimals(e.target.value, inputMode === "qty" ? 9 : 2))
                setAmount(e.target.value);
            }}
          />
        </div>
      )}

      {/* Price inputs: BUY MARKET → collar only; BUY LIMIT → limit only; SELL → nothing */}
      {!isSell && type === "MARKET" ? (
        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
          Collar price (optional)
          <Input
            aria-label="Collar price"
            type="number"
            min="0"
            step="any"
            value={collarPrice}
            onChange={(e) => {
              if (withinDecimals(e.target.value, 2)) setCollarPrice(e.target.value);
            }}
          />
        </label>
      ) : null}
      {type === "LIMIT" ? (
        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
          Limit price
          <Input
            aria-label="Limit price"
            type="number"
            min="0"
            step="any"
            value={limitPrice}
            onChange={(e) => {
              if (withinDecimals(e.target.value, 2)) setLimitPrice(e.target.value);
            }}
          />
        </label>
      ) : null}

      {/* TIF: DAY and GTC only */}
      <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
        Time in force
        <Select
          modal={false}
          value={tif}
          onValueChange={(next) => setTif(next as TimeInForce)}
        >
          <SelectTrigger aria-label="Time in force" className="w-full">
            <SelectValue>{tif}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CLIENT_TIF_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      {/* Quote preview */}
      {symbol && selectedUser ? (
        <PriceQuoteCard
          symbol={symbol}
          side={side}
          clientId={selectedUser.clientId}
          qty={isSell ? amount : inputMode === "qty" ? amount : undefined}
          notional={!isSell && inputMode === "notional" ? amount : undefined}
          limitPrice={type === "LIMIT" ? limitPrice : undefined}
        />
      ) : null}

      {message ? (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={
            message.tone === "success"
              ? "text-sm text-emerald-600"
              : "text-sm text-destructive"
          }
        >
          {message.text}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={
          !selectedUser ||
          Boolean(validationError) ||
          isLoading ||
          symbolsQuery.isLoading
        }
      >
        {isLoading
          ? "Submitting…"
          : isSell
            ? "Place sell order"
            : "Place buy order"}
      </Button>
    </form>
  );
}
