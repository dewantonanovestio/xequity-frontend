"use client";

import { useParams } from "next/navigation";
import { EndUsersView } from "@/components/client/EndUsersView";

export default function EndUsersPage() {
  const { clientId } = useParams<{ clientId: string }>();
  return <EndUsersView clientId={clientId} />;
}
