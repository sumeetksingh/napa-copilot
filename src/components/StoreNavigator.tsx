"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { NetworkStoreHealth } from "@/lib/types";

type StoreNavigatorProps = {
  stores: NetworkStoreHealth[];
  onNavigate: (storeId: string) => void;
};

export default function StoreNavigator({ stores, onNavigate }: StoreNavigatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "critical" | "watch" | "healthy">("all");

  const filteredStores = useMemo(() => {
    let filtered = stores;

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((store) => store.status === filterStatus);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(
        (store) =>
          store.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          store.region.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by status (critical first, then watch, then healthy)
    return filtered.sort((a, b) => {
      const statusOrder = { critical: 0, watch: 1, healthy: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [stores, searchQuery, filterStatus]);

  const statusCounts = useMemo(() => {
    return {
      critical: stores.filter((s) => s.status === "critical").length,
      watch: stores.filter((s) => s.status === "watch").length,
      healthy: stores.filter((s) => s.status === "healthy").length,
    };
  }, [stores]);

  const getStatusColor = (status: NetworkStoreHealth["status"]) => {
    switch (status) {
      case "critical":
        return "#f87171";
      case "watch":
        return "#facc15";
      case "healthy":
        return "#34d399";
    }
  };

  const getStatusIcon = (status: NetworkStoreHealth["status"]) => {
    switch (status) {
      case "critical":
        return "🔴";
      case "watch":
        return "🟡";
      case "healthy":
        return "🟢";
    }
  };

  return (
    <div className="store-navigator">
      {/* Header - Always Visible */}
      <button
        className="store-navigator__toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="store-navigator__toggle-left">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <div className="store-navigator__toggle-info">
            <span className="label">Store Navigator</span>
            <span className="count">{stores.length} stores</span>
          </div>
        </div>
        <div className="store-navigator__toggle-right">
          <div className="status-badges">
            <span className="status-badge status-badge--critical">{statusCounts.critical}</span>
            <span className="status-badge status-badge--watch">{statusCounts.watch}</span>
            <span className="status-badge status-badge--healthy">{statusCounts.healthy}</span>
          </div>
          <svg
            className="w-5 h-5 chevron"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="store-navigator__content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Search and Filters */}
            <div className="store-navigator__controls">
              <div className="search-box">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search stores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
                  onClick={() => setFilterStatus("all")}
                >
                  All ({stores.length})
                </button>
                <button
                  className={`filter-btn ${filterStatus === "critical" ? "active" : ""}`}
                  onClick={() => setFilterStatus("critical")}
                >
                  🔴 Critical ({statusCounts.critical})
                </button>
                <button
                  className={`filter-btn ${filterStatus === "watch" ? "active" : ""}`}
                  onClick={() => setFilterStatus("watch")}
                >
                  🟡 Watch ({statusCounts.watch})
                </button>
                <button
                  className={`filter-btn ${filterStatus === "healthy" ? "active" : ""}`}
                  onClick={() => setFilterStatus("healthy")}
                >
                  🟢 Healthy ({statusCounts.healthy})
                </button>
              </div>
            </div>

            {/* Store List */}
            <div className="store-navigator__list">
              {filteredStores.map((store, index) => (
                <motion.button
                  key={store.id}
                  className="store-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  onClick={() => onNavigate(store.id.toLowerCase())}
                >
                  <div className="store-item__status">
                    <span
                      className="status-dot"
                      style={{ backgroundColor: getStatusColor(store.status) }}
                    />
                  </div>

                  <div className="store-item__info">
                    <div className="store-item__header">
                      <span className="store-item__id">{store.id}</span>
                      <span className="store-item__name">{store.name}</span>
                    </div>
                    <div className="store-item__meta">
                      <span className="region">{store.region}</span>
                      <span className="capacity">
                        {Math.round(store.capacityPct * 100)}% capacity
                      </span>
                      {store.returnsPending > 0 && (
                        <span className="returns">{store.returnsPending} returns</span>
                      )}
                    </div>
                  </div>

                  <div className="store-item__action">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.button>
              ))}

              {filteredStores.length === 0 && (
                <div className="store-navigator__empty">
                  <p>No stores found matching your criteria.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
