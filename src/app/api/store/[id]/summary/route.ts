import { NextResponse } from "next/server";
import storeTotals from "@/data/store-totals.json";
import categoriesTemplate from "@/data/store-categories.json";
import skuPerformanceTemplate from "@/data/store-sku-performance.json";

export async function GET(_: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  const resolved = "then" in context.params ? await context.params : context.params;
  const storeId = resolved.id.toUpperCase();
  const categories = structuredClone(categoriesTemplate);
  const skuPerformance = structuredClone(skuPerformanceTemplate);

  const totals = (storeTotals as Record<string, { onHand: number; skuCount: number; capacityPct: number }>)[storeId] ?? {
    onHand: 128450,
    skuCount: 8421,
    capacityPct: 1.01,
  };

  return NextResponse.json({
    storeId,
    asOf: new Date().toISOString().slice(0, 10),
    totals,
    categories,
    skuPerformance,
  });
}
