"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useGetEndUsersQuery } from "@/lib/api/userApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EndUserPickerProps {
  clientId: string;
  basePath: string;
}

export function EndUserPicker({ clientId, basePath }: EndUserPickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const endUserId = searchParams.get("endUserId") ?? "";
  const endUsersQuery = useGetEndUsersQuery({ clientId });

  const activeUser = endUsersQuery.data?.find((u) => u.endUserId === endUserId);

  const handleChange = (value: string) => {
    router.replace(`${basePath}?endUserId=${value}`);
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">End user:</span>
      <Select
        modal={false}
        value={endUserId}
        onValueChange={handleChange}
        disabled={endUsersQuery.isLoading}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue>
            {activeUser?.externalId ??
              (endUsersQuery.isLoading ? "Loading…" : "Select end user")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(endUsersQuery.data ?? []).map((u) => (
            <SelectItem key={u.endUserId} value={u.endUserId}>
              {u.externalId}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
