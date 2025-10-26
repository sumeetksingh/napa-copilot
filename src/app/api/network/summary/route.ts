import { NextResponse } from "next/server";
import type { NetworkSummary } from "@/lib/types";
import stores from "@/data/network-stores.json";
import suggestedActions from "@/data/network-actions.json";

const STORES = stores as NetworkSummary["stores"];
const SUGGESTED_ACTIONS = suggestedActions as NetworkSummary["suggested"];

export async function GET() {
  const payload: NetworkSummary = {
    generatedAt: new Date().toISOString(),
    stores: STORES,
    suggested: SUGGESTED_ACTIONS,
  };
  return NextResponse.json(payload, { headers: { "cache-control": "no-store" } });
}
