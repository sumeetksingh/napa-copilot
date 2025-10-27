import { headers } from "next/headers";
import CommandCenter from "@/components/CommandCenter";
import type { NetworkSummary } from "@/lib/types";
import stores from "@/data/network-stores.json";
import suggestedActions from "@/data/network-actions.json";

const FALLBACK_SUMMARY: NetworkSummary = {
  generatedAt: new Date().toISOString(),
  stores: stores as NetworkSummary["stores"],
  suggested: suggestedActions as NetworkSummary["suggested"],
};

async function resolveBaseUrl() {
  const hdrs = await headers();
  const forwardedHost = hdrs.get("x-forwarded-host");
  const host = forwardedHost ?? hdrs.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}

async function fetchNetworkSummary(): Promise<NetworkSummary> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? (await resolveBaseUrl());
    const res = await fetch(`${base}/api/network/summary`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to load network summary (status ${res.status})`);
    }
    return (await res.json()) as NetworkSummary;
  } catch (error) {
    console.warn("Falling back to bundled network summary", error);
    return {
      ...FALLBACK_SUMMARY,
      generatedAt: new Date().toISOString(),
    };
  }
}

export default async function DashboardPage() {
  const summary = await fetchNetworkSummary();
  return (
    <div className="h-[calc(100vh-2rem)] p-4">
      <CommandCenter summary={summary} />
    </div>
  );
}
