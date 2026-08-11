"use client";

import { Suspense, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { ClientOrderForm } from "@/components/orders/ClientOrderForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PlaceOrderPanelProps {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  selectedEndUserId: string;
  onEndUserChange: (id: string) => void;
}

export function PlaceOrderPanel({
  symbol,
  onSymbolChange,
  selectedEndUserId,
  onEndUserChange,
}: PlaceOrderPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer py-3 select-none"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Place order</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 pointer-events-none"
            aria-hidden="true"
            tabIndex={-1}
          >
            {isOpen ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isOpen ? (
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
            <ClientOrderForm
              symbol={symbol}
              onSymbolChange={onSymbolChange}
              selectedEndUserId={selectedEndUserId}
              onEndUserChange={onEndUserChange}
            />
          </Suspense>
        </CardContent>
      ) : null}
    </Card>
  );
}
