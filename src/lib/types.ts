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

export type ActionImpact = {
  financial: {
    amount: number; // in dollars
    type: "revenue" | "cost" | "savings";
  };
  operational: {
    capacityChange: number; // percentage change
    turnsImprovement?: number;
    unitsAffected: number;
  };
  timeSensitivity: {
    urgency: "critical" | "important" | "routine";
    deadline?: Date;
    hoursToCritical?: number;
  };
};

export type ActionOrder = {
  id: string;
  skuIds: string[];
  skuCount: number;
  totalUnits: number;
  estimatedCost: number;
  vendor?: string;
  estimatedDelivery?: string;
};

export type ActionReturn = {
  id: string;
  skuIds: string[];
  skuCount: number;
  totalUnits: number;
  capacityFreed: number; // percentage
  processingTime?: string;
};

export type ActionStatus = "pending" | "in_review" | "approved" | "dismissed" | "completed" | "failed";

export type SuggestedAction = {
  id: string;
  storeId: string;
  title: string;
  detail: string;
  type: "capacity" | "returns" | "staffing" | "ops" | "rebalance";
  urgency: "low" | "medium" | "high";
  impact?: ActionImpact;
  orders?: ActionOrder[];
  returns?: ActionReturn[];
  status?: ActionStatus;
  aiConfidence?: number; // 0-100
  autoApprovalEligible?: boolean;
};

export type NetworkSummary = {
  generatedAt: string;
  stores: NetworkStoreHealth[];
  suggested: SuggestedAction[];
};
