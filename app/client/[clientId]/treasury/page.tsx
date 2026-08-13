"use client";

import { useParams } from "next/navigation";
import { ClientTreasuryView } from "@/components/client/ClientTreasuryView";

export default function ClientTreasuryPage() {
  const { clientId } = useParams<{ clientId: string }>();

  return <ClientTreasuryView clientId={clientId} />;
}
