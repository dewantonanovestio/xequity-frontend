"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getEnvLabel } from "@/lib/utils/env";

type Environment = "local" | "staging" | "production";

function classifyEnvironment(label: string): Environment {
  const normalizedLabel = label.toLowerCase();

  if (
    normalizedLabel.startsWith("localhost") ||
    normalizedLabel.startsWith("127.0.0.1") ||
    normalizedLabel.startsWith("[::1]")
  ) {
    return "local";
  }

  return normalizedLabel.includes("staging") ? "staging" : "production";
}

export default function TopBar() {
  const environmentLabel = getEnvLabel();
  const environment = classifyEnvironment(environmentLabel);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6">
      <div>
        <p className="text-base font-semibold tracking-tight">xequity-face</p>
        <p className="text-xs text-muted-foreground">Developer dashboard</p>
      </div>

      <Badge
        variant="outline"
        data-environment={environment}
        className={cn(
          "h-6 font-mono",
          environment === "local" &&
            "border-emerald-200 bg-emerald-50 text-emerald-700",
          environment === "staging" &&
            "border-amber-200 bg-amber-50 text-amber-700",
          environment === "production" &&
            "border-red-200 bg-red-50 text-red-700",
        )}
      >
        {environmentLabel}
      </Badge>
    </header>
  );
}
