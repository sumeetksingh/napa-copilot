export type CategorySummary = {
  name: string;
  pct: number;
};

export type StoreTotals = {
  onHand: number;
  skuCount: number;
  capacityPct: number;
};

export type SkuPerformance = {
  id: string;
  name: string;
  category: string;
  onHand: number;
  weeklySales: number;
  capacityPct: number;
  reason: string;
  ranking: number;
};

export type StoreSummary = {
  storeId: string;
  asOf: string;
  totals: StoreTotals;
  categories: CategorySummary[];
  skuPerformance: SkuPerformance[];
};

export type NetworkStoreHealth = {
  id: string;
  name: string;
  region: string;
  location: { lat: number; lng: number };
  capacityPct: number;
  returnsPending: number;
  status: "healthy" | "watch" | "critical";
};

export type SuggestedAction = {
  id: string;
  storeId: string;
  title: string;
  detail: string;
  type: "capacity" | "returns" | "staffing" | "ops";
  urgency: "low" | "medium" | "high";
};

export type NetworkSummary = {
  generatedAt: string;
  stores: NetworkStoreHealth[];
  suggested: SuggestedAction[];
};
