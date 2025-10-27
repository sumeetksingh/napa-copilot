import { create } from "zustand";
import type { StoreSummary } from "@/lib/types";

export type Filters = { categories: string[] };

export type ConversationMessage = {
  id: string;
  role: "agent" | "user" | "system";
  text: string;
  timestamp: string;
  actionId?: string;
  tone?: "alert" | "calm" | "neutral" | "directive" | "suggestion";
};

export type ActionStatus = "pending" | "in_review" | "applied" | "dismissed";

export type AgentActionState = {
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

type SummaryBaseline = {
  categories: Record<string, number>;
  capacityPct: number;
  onHand: number;
  skuPerformance: Array<{
    id: string;
    name: string;
    category: string;
    onHand: number;
    weeklySales: number;
    capacityPct: number;
    reason: string;
    ranking: number;
  }>;
};

type SummaryOverrides = {
  categoryAdjustments: Record<string, number>;
  capacityOffset: number;
  onHandOffset: number;
};

type StoreState = {
  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;

  highlight?: string;
  setHighlight: (c?: string) => void;

  subtitle?: string;
  setSubtitle: (s?: string) => void;

  conversation: ConversationMessage[];
  appendConversation: (message: Omit<ConversationMessage, "id" | "timestamp"> & { id?: string; timestamp?: string }) => void;
  clearConversation: () => void;

  actions: AgentActionState[];
  upsertAction: (action: AgentActionState) => void;
  removeAction: (id: string) => void;
  clearActions: () => void;

  actionStatuses: Record<string, ActionStatus>;
  setActionStatus: (id: string, status: ActionStatus) => void;

  activeAction?: AgentActionState | null;
  setActiveAction: (action?: AgentActionState | null) => void;

  baseline?: SummaryBaseline;
  setBaseline: (summary: StoreSummary) => void;

  overrides: SummaryOverrides;
  applyShift: (action: AgentActionState) => void;
  resetOverrides: () => void;
  setTargetCapacity: (targetPct: number) => void;
  createAdHocAction: (params: { category: string; intent: "remove" | "add" }) => AgentActionState | null;

  hasHeardIntro: boolean;
  setHasHeardIntro: (value: boolean) => void;
};

const randomId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const initialOverrides: SummaryOverrides = {
  categoryAdjustments: {},
  capacityOffset: 0,
  onHandOffset: 0,
};

export const useStore = create<StoreState>((set, get) => ({
  filters: { categories: [] },
  setFilters: (f) => set((state) => ({ filters: { ...state.filters, ...f } })),

  highlight: undefined,
  setHighlight: (c) => set({ highlight: c }),

  subtitle: undefined,
  setSubtitle: (s) => set({ subtitle: s }),

  conversation: [],
  appendConversation: ({ id, role, text, actionId, timestamp, tone }) =>
    set((state) => {
      const messageId = id ?? randomId();
      if (state.conversation.some((msg) => msg.id === messageId)) {
        return state;
      }
      return {
        conversation: [
          ...state.conversation,
          {
            id: messageId,
            role,
            text,
            actionId,
            timestamp: timestamp ?? new Date().toISOString(),
            tone,
          },
        ],
      };
    }),
  clearConversation: () => set({ conversation: [] }),

  actions: [],
  upsertAction: (action) =>
    set((state) => {
      const remove = action.remove ?? [];
      const add = action.add ?? [];
      const normalized: AgentActionState = { ...action, remove, add };
      const existingIndex = state.actions.findIndex((item) => item.id === action.id);
      if (existingIndex >= 0) {
        const next = [...state.actions];
        next[existingIndex] = { ...next[existingIndex], ...normalized };
        return { actions: next };
      }
      return { actions: [...state.actions, normalized] };
    }),
  removeAction: (id) =>
    set((state) => ({
      actions: state.actions.filter((action) => action.id !== id),
    })),
  clearActions: () => set({ actions: [], actionStatuses: {} }),

  actionStatuses: {},
  setActionStatus: (id, status) =>
    set((state) => ({
      actionStatuses: { ...state.actionStatuses, [id]: status },
    })),

  activeAction: null,
  setActiveAction: (action) => set({ activeAction: action ?? null }),

  baseline: undefined,
  setBaseline: (summary) =>
    set((state) => {
      if (state.baseline) {
        return state;
      }
      const categories: Record<string, number> = {};
      summary.categories.forEach((cat) => {
        categories[cat.name] = cat.pct;
      });
      return {
        baseline: {
          categories,
          capacityPct: summary.totals.capacityPct,
          onHand: summary.totals.onHand,
          skuPerformance: summary.skuPerformance,
        },
        overrides: { ...initialOverrides },
        hasHeardIntro: false,
      };
    }),

  overrides: { ...initialOverrides },
  applyShift: (action) =>
    set((state) => {
      const baseline = state.baseline;
      if (!baseline) return state;
      if (state.actionStatuses[action.id] === "applied") return state;
      const ratio = Math.max(0, action.shiftPct) / 100;
      const adjustments = { ...state.overrides.categoryAdjustments };
      adjustments[action.sourceCategory] = (adjustments[action.sourceCategory] ?? 0) - ratio;
      adjustments[action.targetCategory] = (adjustments[action.targetCategory] ?? 0) + ratio;
      const baseCapacityDelta = ratio * 0.2;
      const capacityDelta = baseCapacityDelta > 0 ? Math.max(baseCapacityDelta, 0.05) : 0;
      const capacityOffset = state.overrides.capacityOffset - capacityDelta;
      const baseOnHandDelta = Math.round(baseline.onHand * ratio * 0.05);
      const onHandScale = baseCapacityDelta > 0 ? capacityDelta / baseCapacityDelta : 1;
      const scaledOnHandDelta =
        baseCapacityDelta > 0 ? Math.max(1, Math.round(baseOnHandDelta * onHandScale)) : baseOnHandDelta;
      const onHandOffset = state.overrides.onHandOffset - scaledOnHandDelta;
      return {
        overrides: {
          categoryAdjustments: adjustments,
          capacityOffset,
          onHandOffset,
        },
        actionStatuses: { ...state.actionStatuses, [action.id]: "applied" },
      };
    }),
  resetOverrides: () => set({ overrides: { ...initialOverrides } }),

  setTargetCapacity: (targetPct) =>
    set((state) => {
      const baseline = state.baseline;
      if (!baseline) return state;
      const targetRatio = targetPct > 2 ? targetPct / 100 : targetPct;
      const currentCapacity = baseline.capacityPct + state.overrides.capacityOffset;
      const offsetDiff = targetRatio - currentCapacity;
      const onHandDiff = Math.round(baseline.onHand * (-offsetDiff) * 0.4);
      return {
        overrides: {
          categoryAdjustments: { ...state.overrides.categoryAdjustments },
          capacityOffset: state.overrides.capacityOffset + offsetDiff,
          onHandOffset: state.overrides.onHandOffset + onHandDiff,
        },
      };
    }),

  createAdHocAction: ({ category, intent }) => {
    const state = get();
    const baseline = state.baseline;
    if (!baseline) return null;
    const normalizedCategory = category.toLowerCase();
    const matchingSku = baseline.skuPerformance.filter((sku) => sku.category.toLowerCase() === normalizedCategory);
    if (!matchingSku.length) {
      return null;
    }

    const id = `adhoc-${intent}-${normalizedCategory}-${Date.now()}`;
    const title =
      intent === "remove"
        ? `Trim ${category} inventory`
        : `Backfill ${category} inventory`;
    const shiftPct = intent === "remove" ? 5 : 4;
    const sourceCategory = intent === "remove" ? category : "Buffer";
    const targetCategory = intent === "remove" ? "Buffer" : category;

    const remove = intent === "remove" ? matchingSku.slice(0, 3) : [];
    const add =
      intent === "add"
        ? matchingSku.slice(0, 3).map((sku, index) => ({
            id: `${sku.id}-REPL-${index}`,
            name: `${sku.name} restock`,
            fitScore: Math.min(99, 92 - index * 4),
            rationale: `Proven mover in ${category.toLowerCase()} with ${Math.round(sku.weeklySales)} weekly sales`,
          }))
        : matchingSku.slice(0, 3).map((sku) => ({
            id: sku.id,
            name: sku.name,
            fitScore: Math.max(40, Math.round(100 - sku.capacityPct * 120)),
            rationale: sku.reason,
          }));

    const newAction: AgentActionState = {
      id,
      title,
      summary:
        intent === "remove"
          ? `Trim slow-moving SKUs from ${category} and stage them for return to normalize capacity.`
          : `Backfill high-turn SKUs into ${category} to improve availability and health.`,
      severity: remove.length ? "high" : "medium",
      type: intent === "remove" ? "trim" : "restock",
      shiftPct,
      sourceCategory,
      targetCategory,
      remove,
      add,
    };

    set((state) => ({
      actions: [...state.actions, newAction],
      actionStatuses: { ...state.actionStatuses, [id]: "pending" },
    }));

    return newAction;
  },

  hasHeardIntro: false,
  setHasHeardIntro: (value) => set({ hasHeardIntro: value }),
}));
