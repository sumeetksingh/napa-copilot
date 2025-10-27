import { headers } from "next/headers";
import { notFound } from "next/navigation";
import PulseExperience from "@/components/PulseExperience";
import type { StoreSummary } from "@/lib/types";
import storeTotals from "@/data/store-totals.json";
import categoriesTemplate from "@/data/store-categories.json";
import skuPerformanceTemplate from "@/data/store-sku-performance.json";

export const dynamic = "force-dynamic";

async function resolveBaseUrl() {
  const hdrs = await headers();
  const forwardedHost = hdrs.get("x-forwarded-host");
  const host = forwardedHost ?? hdrs.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}

const fallbackStoreSummary = (storeId: string): StoreSummary => {
  const totals =
    (storeTotals as Record<string, { onHand: number; skuCount: number; capacityPct: number }>)[storeId] ?? {
      onHand: 128450,
      skuCount: 8421,
      capacityPct: 1.01,
    };

  return {
    storeId,
    asOf: new Date().toISOString().slice(0, 10),
    totals,
    categories: structuredClone(categoriesTemplate),
    skuPerformance: structuredClone(skuPerformanceTemplate),
  };
};

async function fetchStoreSummary(storeId: string): Promise<StoreSummary> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? (await resolveBaseUrl());
    const res = await fetch(`${base}/api/store/${storeId}/summary`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to load store summary (status ${res.status})`);
    }
    return (await res.json()) as StoreSummary;
  } catch (error) {
    console.warn(`Falling back to bundled store summary for ${storeId}`, error);
    return fallbackStoreSummary(storeId);
  }
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
