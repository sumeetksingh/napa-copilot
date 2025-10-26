import { NextResponse } from "next/server";
import stores from "@/data/network-stores.json";
import totals from "@/data/store-totals.json";
import categoriesTemplate from "@/data/store-categories.json";
import skuTemplate from "@/data/store-sku-performance.json";

type StoreTotals = Record<string, { onHand: number; skuCount: number; capacityPct: number }>;

const DEFAULT_STORE_ID = "ATL_050";
const DEFAULT_MODEL = process.env.OPENAI_AGENT_MODEL ?? "gpt-4o-mini";

function ensureKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return key;
}

function computeInventoryHealth(capacityPct: number) {
  const delta = Math.abs(capacityPct - 1);
  const score = Math.round(100 - delta * 500);
  return Math.max(0, Math.min(100, score));
}

function findStore(storeId: string) {
  const normalized = storeId.toUpperCase();
  return stores.find((store) => store.id === normalized) ?? stores.find((store) => store.id === DEFAULT_STORE_ID)!;
}

type LlmAction = {
  id: string;
  title: string;
  summary: string;
  voiceSummary?: string;
  severity: "high" | "medium" | "low";
  type: string;
  shiftPct: number;
  sourceCategory: string;
  targetCategory: string;
  remove: Array<{ id: string; name: string; reason: string; ranking: number; capacityPct: number }>;
  add: Array<{ id: string; name: string; fitScore: number; rationale: string }>;
};

type LlmNarration = {
  id: string;
  order: number;
  tone: "alert" | "calm" | "neutral" | "directive" | "suggestion";
  text: string;
  actionId?: string;
};

type ConversationSnippet = {
  role: "agent" | "user" | "system";
  text: string;
};

async function callOpenAI(payload: {
  store: (typeof stores)[number];
  totals: StoreTotals[string];
  categories: typeof categoriesTemplate;
  skuPerformance: typeof skuTemplate;
  instruction?: string;
  conversation?: ConversationSnippet[];
}) {
  const apiKey = ensureKey();
  const url = "https://api.openai.com/v1/chat/completions";
  const { store, totals, categories, skuPerformance, instruction, conversation } = payload;

  const inventoryHealth = computeInventoryHealth(totals.capacityPct ?? store.capacityPct);

  const systemPrompt = `You are Pulse, a precise inventory operations co-pilot for auto-parts distribution.
You analyze store telemetry and propose clear spoken narration plus a structured list of actions.
Always return valid JSON that matches the requested schema.
Keep narration to no more than 4 steps. Focus on inventory capacity, returns, and SKU imbalances.
When suggesting actions, include at least one recommendation if the store is over 100% capacity.
If the user provided an instruction, interpret it and recommend SKU-level adjustments using the ranked SKU lists.`;

  const jsonSchema = {
    name: "PulseAgentResponse",
    schema: {
      type: "object",
      properties: {
        narration: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              order: { type: "integer" },
              tone: { enum: ["alert", "calm", "neutral", "directive", "suggestion"] },
              text: { type: "string" },
              actionId: { type: ["string", "null"] },
            },
            required: ["id", "order", "tone", "text"],
            additionalProperties: false,
          },
        },
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              summary: { type: "string" },
              severity: { enum: ["high", "medium", "low"] },
              type: { type: "string" },
              shiftPct: { type: "number" },
              sourceCategory: { type: "string" },
              targetCategory: { type: "string" },
              remove: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    reason: { type: "string" },
                    ranking: { type: "integer" },
                    capacityPct: { type: "number" },
                  },
                  required: ["id", "name", "reason", "ranking", "capacityPct"],
                  additionalProperties: false,
                },
              },
              add: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    fitScore: { type: "number" },
                    rationale: { type: "string" },
                  },
                  required: ["id", "name", "fitScore", "rationale"],
                  additionalProperties: false,
                },
              },
            },
            required: [
              "id",
              "title",
              "summary",
              "severity",
              "type",
              "shiftPct",
              "sourceCategory",
              "targetCategory",
              "remove",
              "add",
            ],
            additionalProperties: false,
          },
        },
      },
      required: ["narration", "actions"],
      additionalProperties: false,
    },
  };

  const userPrompt = {
    store,
    totals,
    inventoryHealth,
    categories,
    skuPerformance,
    instruction: instruction ?? null,
    conversation: conversation?.slice(-8) ?? [],
  };

  const completionResponse = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Store context:\n${JSON.stringify(userPrompt, null, 2)}\n\nReturn JSON that matches the schema.`,
        },
      ],
      response_format: { type: "json_schema", json_schema: jsonSchema },
    }),
  });

  if (!completionResponse.ok) {
    const errorText = await completionResponse.text();
    throw new Error(`OpenAI request failed (${completionResponse.status}): ${errorText}`);
  }

  const completion = await completionResponse.json();
  const rawContent = completion.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error("OpenAI returned an empty response.");
  }

  const jsonPayload =
    typeof rawContent === "string"
      ? rawContent
      : Array.isArray(rawContent)
        ? rawContent.map((entry: { type: string; text?: string }) => entry?.text ?? "").join("")
        : "";

  if (!jsonPayload) {
    throw new Error("OpenAI response content could not be parsed.");
  }

  const parsed: { narration: LlmNarration[]; actions: LlmAction[] } = JSON.parse(jsonPayload);
  return parsed;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function buildPayload(storeId: string) {
  const store = findStore(storeId);
  const storeTotals = (totals as StoreTotals)[store.id] ?? {
    onHand: 0,
    skuCount: 0,
    capacityPct: store.capacityPct,
  };

  return {
    store,
    storeTotals,
    categories: structuredClone(categoriesTemplate),
    skuPerformance: structuredClone(skuTemplate),
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedId = url.searchParams.get("storeId") ?? DEFAULT_STORE_ID;
  const wantsStream = url.searchParams.get("mode") === "stream";

  const { store, storeTotals, categories, skuPerformance } = await buildPayload(requestedId);

  try {
    const llmResult = await callOpenAI({
      store,
      totals: storeTotals,
      categories,
      skuPerformance,
    });

    const payload = {
      generatedAt: new Date().toISOString(),
      store: {
        id: store.id,
        name: store.name,
        region: store.region,
        status: store.status,
        capacityPct: storeTotals.capacityPct ?? store.capacityPct,
        inventoryHealth: computeInventoryHealth(storeTotals.capacityPct ?? store.capacityPct),
        totals: storeTotals,
      },
      categories,
      skuPerformance,
      narration: llmResult.narration,
      actions: llmResult.actions,
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
        await sleep(200);
        send("categories", categories);
        await sleep(160);
        send("skuPerformance", skuPerformance);

        for (const step of payload.narration) {
          await sleep(360);
          send("narration", step);
        }

        for (const action of payload.actions) {
          await sleep(320);
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
  } catch (error) {
    console.error("live agent failed", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Agent unavailable" },
      { status: 500, headers: { "cache-control": "no-store" } },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      storeId?: string;
      instruction?: string;
      conversation?: ConversationSnippet[];
    };

    const storeId = body.storeId?.toUpperCase() ?? DEFAULT_STORE_ID;
    const { store, storeTotals, categories, skuPerformance } = await buildPayload(storeId);

    const llmResult = await callOpenAI({
      store,
      totals: storeTotals,
      categories,
      skuPerformance,
      instruction: body.instruction,
      conversation: body.conversation,
    });

    return NextResponse.json({
      narration: llmResult.narration,
      actions: llmResult.actions,
    });
  } catch (error) {
    console.error("Live agent command failed", error);
    return NextResponse.json(
      { error: "Unable to process instruction." },
      { status: 500, headers: { "cache-control": "no-store" } },
    );
  }
}
