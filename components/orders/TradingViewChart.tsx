"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => void;
    };
  }
}

// Load tv.js once across all chart instances
let scriptState: "idle" | "loading" | "loaded" = "idle";
const pendingCallbacks: (() => void)[] = [];

function loadTvScript(onReady: () => void) {
  if (scriptState === "loaded") {
    onReady();
    return;
  }
  pendingCallbacks.push(onReady);
  if (scriptState === "loading") return;
  scriptState = "loading";

  const script = document.createElement("script");
  script.src = "https://s3.tradingview.com/tv.js";
  script.onload = () => {
    scriptState = "loaded";
    pendingCallbacks.splice(0).forEach((cb) => cb());
  };
  document.head.appendChild(script);
}

interface TradingViewChartProps {
  symbol: string;
}

export function TradingViewChart({ symbol }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerId = useRef(`tv_${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !symbol) return;

    container.innerHTML = "";
    container.id = containerId.current;

    loadTvScript(() => {
      if (!container.isConnected || !window.TradingView) return;
      const tvSymbol = symbol.includes(":") ? symbol : `NASDAQ:${symbol}`;
      new window.TradingView.widget({
        container_id: containerId.current,
        autosize: true,
        symbol: tvSymbol,
        interval: "D",
        timezone: "Etc/UTC",
        theme: "light",
        style: "1",
        locale: "en",
        toolbar_bg: "#f1f3f6",
        enable_publishing: false,
        allow_symbol_change: false,
        hide_side_toolbar: false,
      });
    });

    return () => {
      container.innerHTML = "";
    };
  }, [symbol]);

  return <div ref={containerRef} className="h-full w-full" />;
}
