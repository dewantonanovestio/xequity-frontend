"use client";

import { useState, type FormEvent } from "react";
import { formatDate } from "@/lib/utils/formatters";
import { useGetEndUsersQuery, useCreateEndUserMutation } from "@/lib/api/userApi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { EndUserState } from "@/lib/types/user";

function stateTone(state: EndUserState): "default" | "secondary" | "destructive" | "outline" {
  switch (state) {
    case "ACTIVE": return "default";
    case "PROVISIONING": return "secondary";
    case "SUSPENDED": return "destructive";
    case "CLOSED": return "outline";
  }
}

function apiErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === "object" && data !== null && "message" in data) {
      return String((data as { message: unknown }).message);
    }
  }
  return "The request could not be completed.";
}

function EndUsersTable({ clientId }: { clientId: string }) {
  const { data: endUsers = [], isLoading, isError } = useGetEndUsersQuery({ clientId });

  return (
    <Card>
      <CardHeader>
        <CardTitle>End Users</CardTitle>
        <CardDescription>
          All end users provisioned under this client.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">External ID</TableHead>
              <TableHead>Sub Account ID</TableHead>
              <TableHead>State</TableHead>
              <TableHead className="pr-4">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }, (_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }, (__, j) => (
                    <TableCell key={j} className="first:pl-4 last:pr-4">
                      <Skeleton className="h-5 w-28" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 px-4 text-center">
                  <p role="alert" className="font-medium text-destructive">
                    End users could not be loaded.
                  </p>
                </TableCell>
              </TableRow>
            ) : endUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 px-4 text-center text-muted-foreground">
                  No end users yet.
                </TableCell>
              </TableRow>
            ) : (
              endUsers.map((user) => (
                <TableRow key={user.endUserId}>
                  <TableCell className="pl-4 font-mono text-sm">{user.externalId}</TableCell>
                  <TableCell>
                    {user.subAccountId ? (
                      <span className="font-mono text-xs text-muted-foreground" title={user.subAccountId}>
                        {user.subAccountId.slice(0, 8)}…
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={stateTone(user.state)}>{user.state}</Badge>
                  </TableCell>
                  <TableCell className="pr-4 text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function CreateEndUserForm({ clientId }: { clientId: string }) {
  const [createEndUser, { isLoading }] = useCreateEndUserMutation();
  const [externalId, setExternalId] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const canSubmit = externalId.trim() && !isLoading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const result = await createEndUser({
        clientId,
        externalId: externalId.trim(),
      }).unwrap();
      setMessage({ tone: "success", text: `End user "${result.externalId}" created. State: ${result.state}.` });
      setExternalId("");
    } catch (error) {
      setMessage({ tone: "error", text: apiErrorMessage(error) });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create End User</CardTitle>
        <CardDescription>
          Provision a new end user under this client. Idempotent by external ID.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 max-w-lg" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <label htmlFor="end-user-external-id" className="text-sm font-medium">
              External ID
            </label>
            <Input
              id="end-user-external-id"
              placeholder="user-123"
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your internal identifier for this user. Must be unique within the client.
            </p>
          </div>

          {message ? (
            <p
              role={message.tone === "error" ? "alert" : "status"}
              className={message.tone === "success" ? "text-sm text-emerald-600" : "text-sm text-destructive"}
            >
              {message.text}
            </p>
          ) : null}

          <Button type="submit" disabled={!canSubmit}>
            {isLoading ? "Creating…" : "Create end user"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function EndUsersView({ clientId }: { clientId: string }) {
  return (
    <section className="mx-auto grid w-full max-w-[1500px] gap-5">
      <header>
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Client dashboard
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">End Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage end users provisioned under this client account.
        </p>
      </header>

      <EndUsersTable clientId={clientId} />
      <CreateEndUserForm clientId={clientId} />
    </section>
  );
}
