import { NextResponse } from "next/server";
import stores from "@/data/network-stores.json";
import totals from "@/data/store-totals.json";
import categoriesTemplate from "@/data/store-categories.json";
import skuTemplate from "@/data/store-sku-performance.json";

type StoreTotals = Record<string, { onHand: number; skuCount: number; capacityPct: number }>;

const DEFAULT_STORE_ID = "ATL_050";

function computeInventoryHealth(capacityPct: number) {
  const delta = Math.abs(capacityPct - 1);
  const score = Math.round(100 - delta * 500);
  return Math.max(0, Math.min(100, score));
}

function findStore(storeId: string) {
  const normalized = storeId.toUpperCase();
  return stores.find((store) => store.id === normalized) ?? stores.find((store) => store.id === DEFAULT_STORE_ID)!;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedId = url.searchParams.get("storeId") ?? DEFAULT_STORE_ID;
  const wantsStream = url.searchParams.get("mode") === "stream";
  const store = findStore(requestedId);
  const storeTotals = (totals as StoreTotals)[store.id] ?? {
    onHand: 0,
    skuCount: 0,
    capacityPct: store.capacityPct,
  };

  const categories = structuredClone(categoriesTemplate);
  const skuPerformance = structuredClone(skuTemplate);

  const capacityPct = storeTotals.capacityPct ?? store.capacityPct;
  const inventoryHealth = computeInventoryHealth(capacityPct);

  const sortedCategories = [...categories].sort((a, b) => b.pct - a.pct);
  const heavyCategories = sortedCategories.slice(0, 2);
  const lightCategories = sortedCategories.slice(-2);

  const actions = heavyCategories.map((heavy, index) => {
    const fallback = lightCategories[Math.max(0, lightCategories.length - 1 - index)] ?? heavy;
    const counterpart =
      fallback.name === heavy.name ? lightCategories[index % Math.max(lightCategories.length, 1)] ?? heavy : fallback;
    const capacityGap = Math.max(0, heavy.pct - counterpart.pct);
    const shiftPct = Math.max(3, Math.round(capacityGap * 100 * 0.6));
    const removeCandidates = skuPerformance
      .filter((sku) => sku.category === heavy.name)
      .sort((a, b) => a.ranking - b.ranking)
      .slice(0, 3)
      .map((sku) => ({
        id: sku.id,
        name: sku.name,
        reason: sku.reason,
        ranking: sku.ranking,
        capacityPct: Math.round(sku.capacityPct * 100),
      }));

    const addCandidates = Array.from({ length: 3 }, (_, i) => ({
      id: `${counterpart.name.slice(0, 3).toUpperCase()}-RESTOCK-${i + 1}`,
      name: `${counterpart.name} replenishment ${i + 1}`,
      fitScore: 93 - i * 5,
      rationale: `High turn potential in ${counterpart.name.toLowerCase()} bays with ${Math.round(
        (counterpart.pct * 100) / (capacityPct > 1 ? capacityPct : 1),
      )}% allocation headroom.`,
    }));

    const severity =
      index === 0 && (capacityPct > 1.08 || capacityGap > 0.08)
        ? "high"
        : capacityGap > 0.05
          ? "medium"
          : "low";

    return {
      id: `action-${store.id.toLowerCase()}-${index + 1}`,
      title: `Rebalance ${heavy.name} into ${counterpart.name}`,
      summary: `Reclaim approximately ${shiftPct}% of bay space from ${heavy.name} (currently ${Math.round(
        heavy.pct * 100,
      )}%) and reallocate to ${counterpart.name} to tighten cycle time.`,
      severity,
      type: "rebalance",
      shiftPct,
      sourceCategory: heavy.name,
      targetCategory: counterpart.name,
      remove: removeCandidates,
      add: addCandidates,
    };
  });

  const narration = [
    {
      id: "overview",
      order: 1,
      tone: capacityPct > 1 ? "alert" : "calm",
      text: `Inventory health for ${store.name} is ${inventoryHealth} with capacity running at ${Math.round(capacityPct * 100)}%.`,
    },
    {
      id: "returns",
      order: 2,
      tone: store.returnsPending > 3 ? "alert" : "neutral",
      text: `${store.returnsPending} returns are pending; keep the dock clear to avoid compounding bay pressure.`,
    },
    ...actions.map((action, idx) => ({
      id: `action-${idx + 1}`,
      order: idx + 3,
      tone: idx === 0 ? "directive" : "suggestion",
      text: `Recommend shifting about ${action.shiftPct}% from ${action.sourceCategory} into ${action.targetCategory} and staging removal of slow SKUs like ${action.remove[0]?.name ?? "current low performers"}.`,
      actionId: action.id,
    })),
  ];

  const payload = {
    generatedAt: new Date().toISOString(),
    store: {
      id: store.id,
      name: store.name,
      region: store.region,
      status: store.status,
      capacityPct,
      inventoryHealth,
      totals: storeTotals,
    },
    categories,
    skuPerformance,
    narration,
    actions,
  };

  if (!wantsStream) {
    return NextResponse.json(payload, { headers: { "cache-control": "no-store" } });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      send("meta", {
        generatedAt: payload.generatedAt,
        store: payload.store,
      });

      await sleep(240);

      send("categories", categories);
      await sleep(160);
      send("skuPerformance", skuPerformance);

      for (const step of narration) {
        await sleep(380);
        send("narration", step);
      }

      for (const action of actions) {
        await sleep(340);
        send("action", action);
      }

      await sleep(200);
      send("complete", { message: "stream-end" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store",
      connection: "keep-alive",
    },
  });
}
