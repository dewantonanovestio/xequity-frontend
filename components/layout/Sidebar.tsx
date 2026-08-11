"use client";

import {
  Activity,
  BookOpenText,
  Building2,
  ChartCandlestick,
  ClipboardList,
  Clock,
  Scale,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { RoleSwitcher } from "@/components/layout/RoleSwitcher";
import { Separator } from "@/components/ui/separator";

const adminNavItems = [
  { page: "orders", label: "Orders", icon: ClipboardList },
  { page: "ledger", label: "Ledger", icon: BookOpenText },
  { page: "recon", label: "Recon", icon: Scale },
  { page: "clients", label: "Clients", icon: Building2 },
  { page: "symbols", label: "Symbols", icon: ChartCandlestick },
];

const clientNavItems = [
  { page: "orders", label: "Orders", icon: ClipboardList },
  { page: "portfolio", label: "Portfolio", icon: Wallet },
  { page: "pnl", label: "P&L", icon: TrendingUp },
  { page: "history", label: "History", icon: Clock },
  { page: "activities", label: "Activities", icon: Activity },
  { page: "end-users", label: "End Users", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isClientPath = pathname.startsWith("/client/");
  const clientId = isClientPath ? pathname.split("/")[2] : null;

  const navigation = isClientPath && clientId
    ? clientNavItems.map(({ page, label, icon }) => ({
        href: `/client/${clientId}/${page}`,
        label,
        icon,
      }))
    : adminNavItems.map(({ page, label, icon }) => ({
        href: `/admin/${page}`,
        label,
        icon,
      }));

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 text-sidebar-foreground">
      <div className="px-3 pb-6">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Debug console
        </p>
      </div>

      <nav aria-label="Primary navigation" className="space-y-1">
        {navigation.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto grid gap-4">
        <Separator />
        <RoleSwitcher />
      </div>
    </aside>
  );
}
