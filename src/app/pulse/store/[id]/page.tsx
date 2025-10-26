import { headers } from "next/headers";
import { notFound } from "next/navigation";
import PulseExperience from "@/components/PulseExperience";
import type { StoreSummary } from "@/lib/types";

async function resolveBaseUrl() {
  const hdrs = await headers();
  const forwardedHost = hdrs.get("x-forwarded-host");
  const host = forwardedHost ?? hdrs.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}

async function fetchStoreSummary(storeId: string): Promise<StoreSummary> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? (await resolveBaseUrl());
  const res = await fetch(`${base}/api/store/${storeId}/summary`, { cache: "no-store" });
  if (!res.ok) {
    console.error("Failed to load store summary", res.status, res.statusText);
    throw new Error(`Failed to load store summary (status ${res.status})`);
  }
  return (await res.json()) as StoreSummary;
}

export default async function StorePage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolved = "then" in params ? await params : params;
  const storeId = resolved.id?.toUpperCase();
  if (!storeId) {
    notFound();
  }

  const summary = await fetchStoreSummary(storeId);
  return <PulseExperience initialSummary={summary} />;
}
