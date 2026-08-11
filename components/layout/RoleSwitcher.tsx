"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch } from "@/lib/store/hooks";
import { setAdminMode } from "@/lib/store/viewModeSlice";
import { useGetClientsQuery } from "@/lib/api/clientApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ADMIN_VALUE = "__admin__";

export function RoleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const clientsQuery = useGetClientsQuery();

  // Derive current value from URL: /client/{id}/... → id, else admin
  const isClientPath = pathname.startsWith("/client/");
  const currentClientId = isClientPath ? pathname.split("/")[2] : null;
  const selectedValue = currentClientId ?? ADMIN_VALUE;

  const handleChange = (value: string | null) => {
    if (!value || value === ADMIN_VALUE) {
      dispatch(setAdminMode());
      router.push("/admin/orders");
      return;
    }
    router.push(`/client/${value}/orders`);
  };

  // Find the current client name to show in the trigger
  const currentClient = currentClientId
    ? clientsQuery.data?.find((c) => c.id === currentClientId)
    : null;

  return (
    <div className="grid gap-2">
      <span className="text-xs font-medium text-muted-foreground">View as:</span>
      <Select modal={false} value={selectedValue} onValueChange={handleChange}>
        <SelectTrigger aria-label="Dashboard role" className="w-full">
          <SelectValue>
            {currentClientId
              ? (currentClient?.legalName ?? currentClientId)
              : "Admin"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value={ADMIN_VALUE}>Admin</SelectItem>
          {(clientsQuery.data ?? []).map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.legalName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
