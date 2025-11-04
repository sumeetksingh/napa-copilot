import { headers } from "next/headers";
import CommandCenterV4 from "@/components/CommandCenterV4";
import type { NetworkSummary } from "@/lib/types";
import "@/styles/command-center-v4.css";
import stores from "@/data/network-stores.json";
import suggestedActions from "@/data/network-actions.json";

export const dynamic = "force-dynamic";

const FALLBACK_SUMMARY = {
  stores: stores as NetworkSummary["stores"],
  suggested: suggestedActions as NetworkSummary["suggested"],
} as const;

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
      generatedAt: new Date().toISOString(),
      ...FALLBACK_SUMMARY,
    };
  }
}

export default async function DashboardPage() {
  const summary = await fetchNetworkSummary();
  return <CommandCenterV4 summary={summary} />;
}
