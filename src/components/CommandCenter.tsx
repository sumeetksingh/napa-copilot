"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { NetworkSummary } from "@/lib/types";
import NetworkMap from "@/components/NetworkMap";
import SuggestedActionsPanel from "@/components/SuggestedActionsPanel";

export default function CommandCenter({ summary }: { summary: NetworkSummary }) {
  const router = useRouter();

  const headlineMetrics = useMemo(() => {
    const atCapacity = summary.stores.filter((store) => store.capacityPct >= 1).length;
    const critical = summary.stores.filter((store) => store.status === "critical").length;
    const averageCapacity =
      summary.stores.reduce((acc, store) => acc + store.capacityPct, 0) / summary.stores.length;
    return {
      atCapacity,
      critical,
      averageCapacity: Math.round(averageCapacity * 100),
    };
  }, [summary.stores]);

  return (
    <div className="command-center">
      <div className="command-center__header">
        <div>
          <h1 className="command-center__title">Pulse Command Center</h1>
          <p className="command-center__subtitle">
            Monitoring {summary.stores.length.toLocaleString()} stores across the network • Updated{' '}
            {new Date(summary.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="command-center__metrics">
          <div className="metric-card">
            <span className="metric-card__label">Average Capacity</span>
            <span className="metric-card__value">{headlineMetrics.averageCapacity}%</span>
          </div>
          <div className="metric-card">
            <span className="metric-card__label">At / Above Capacity</span>
            <span className="metric-card__value">{headlineMetrics.atCapacity}</span>
          </div>
          <div className="metric-card">
            <span className="metric-card__label">Critical Alerts</span>
            <span className="metric-card__value metric-card__value--alert">{headlineMetrics.critical}</span>
          </div>
        </div>
      </div>

      <div className="command-center__body">
        <div className="command-center__map">
          <NetworkMap
            stores={summary.stores}
            onSelect={(storeId) => router.push(`/pulse/store/${storeId.toLowerCase()}`)}
          />
        </div>
        <div className="command-center__actions">
          <SuggestedActionsPanel
            actions={summary.suggested}
            onReview={(storeId) => router.push(`/pulse/store/${storeId.toLowerCase()}`)}
          />
        </div>
      </div>

      <div className="command-center__footer">
        <button
          className="command-center__footer-btn"
          onClick={() => router.push("/pulse/store/atl_012")}
        >
          Return to ATL_012 store view
        </button>
        <button className="command-center__footer-btn" onClick={() => router.push("/pulse")}>Open default store</button>
        <button className="command-center__footer-btn command-center__footer-btn--ghost">
          Export network snapshot
        </button>
      </div>
    </div>
  );
}
