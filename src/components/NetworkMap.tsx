"use client";

import { useMemo, useState } from "react";
import type { NetworkStoreHealth } from "@/lib/types";

const STATUS_ORDER: NetworkStoreHealth["status"][] = ["critical", "watch", "healthy"];

const STATUS_LABEL: Record<NetworkStoreHealth["status"], string> = {
  healthy: "Healthy",
  watch: "Watch",
  critical: "Critical",
};

type StatusFilters = Record<NetworkStoreHealth["status"], boolean>;

const MAX_VISIBLE_ROWS = 120;

export default function NetworkMap({
  stores,
  onSelect,
}: {
  stores: NetworkStoreHealth[];
  onSelect: (storeId: string) => void;
}) {
  const [statusFilters, setStatusFilters] = useState<StatusFilters>(() => ({
    healthy: true,
    watch: true,
    critical: true,
  }));
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const regions = useMemo(() => {
    const unique = Array.from(new Set(stores.map((store) => store.region)));
    unique.sort((a, b) => a.localeCompare(b));
    return unique;
  }, [stores]);

  const networkTotals = useMemo(() => {
    let capacitySum = 0;
    let returnsTotal = 0;
    const counts: Record<NetworkStoreHealth["status"], number> = {
      healthy: 0,
      watch: 0,
      critical: 0,
    };

    for (const store of stores) {
      counts[store.status] += 1;
      capacitySum += store.capacityPct;
      returnsTotal += store.returnsPending;
    }

    return {
      total: stores.length,
      counts,
      avgCapacity: stores.length ? capacitySum / stores.length : 0,
      returnsTotal,
    };
  }, [stores]);

  const filteredStores = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    const shouldFilterByRegion = regionFilter !== "all";

    return stores.filter((store) => {
      if (!statusFilters[store.status]) {
        return false;
      }

      if (shouldFilterByRegion && store.region !== regionFilter) {
        return false;
      }

      if (normalizedQuery) {
        const target = `${store.id} ${store.name} ${store.region}`.toLowerCase();
        return target.includes(normalizedQuery);
      }

      return true;
    });
  }, [stores, statusFilters, regionFilter, searchTerm]);

  const filteredTotals = useMemo(() => {
    let capacitySum = 0;
    let returnsTotal = 0;
    const counts: Record<NetworkStoreHealth["status"], number> = {
      healthy: 0,
      watch: 0,
      critical: 0,
    };

    for (const store of filteredStores) {
      counts[store.status] += 1;
      capacitySum += store.capacityPct;
      returnsTotal += store.returnsPending;
    }

    return {
      total: filteredStores.length,
      counts,
      avgCapacity: filteredStores.length ? capacitySum / filteredStores.length : 0,
      returnsTotal,
    };
  }, [filteredStores]);

  const regionBreakdown = useMemo(() => {
    const map = new Map<
      string,
      {
        region: string;
        total: number;
        critical: number;
        watch: number;
        healthy: number;
        capacitySum: number;
        returns: number;
      }
    >();

    for (const store of filteredStores) {
      if (!map.has(store.region)) {
        map.set(store.region, {
          region: store.region,
          total: 0,
          critical: 0,
          watch: 0,
          healthy: 0,
          capacitySum: 0,
          returns: 0,
        });
      }

      const entry = map.get(store.region)!;
      entry.total += 1;
      entry[store.status] += 1;
      entry.capacitySum += store.capacityPct;
      entry.returns += store.returnsPending;
    }

    return Array.from(map.values())
      .map((entry) => ({
        ...entry,
        avgCapacity: entry.total ? entry.capacitySum / entry.total : 0,
      }))
      .sort((a, b) => {
        if (b.total === a.total) {
          return b.critical - a.critical;
        }
        return b.total - a.total;
      });
  }, [filteredStores]);

  const visibleStores = useMemo(
    () =>
      filteredStores
        .slice()
        .sort((a, b) => {
          const statusRank = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
          if (statusRank !== 0) {
            return statusRank;
          }
          return b.capacityPct - a.capacityPct;
        })
        .slice(0, MAX_VISIBLE_ROWS),
    [filteredStores],
  );

  const hiddenCount = filteredStores.length - visibleStores.length;

  const toggleStatus = (status: NetworkStoreHealth["status"]) => {
    setStatusFilters((prev) => {
      if (!prev[status]) {
        return { ...prev, [status]: true };
      }

      const activeCount = Object.values(prev).filter(Boolean).length;
      if (activeCount <= 1) {
        return prev;
      }

      return { ...prev, [status]: false };
    });
  };

  return (
    <div className="network-map">
      <div className="network-map__header">
        <div>
          <h2 className="network-map__title">Network Health</h2>
          <p className="network-map__subtitle">
            Monitoring {networkTotals.total.toLocaleString()} locations. Use filters to focus on active hotspots.
          </p>
        </div>
        <div className="network-map__actions">
          <div className="network-map__search">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path
                fill="currentColor"
                d="M8.75 1.5a7.25 7.25 0 0 1 5.734 11.654l3.281 3.281a.75.75 0 1 1-1.06 1.06l-3.281-3.28A7.25 7.25 0 1 1 8.75 1.5Zm0 1.5a5.75 5.75 0 1 0 0 11.5 5.75 5.75 0 0 0 0-11.5Z"
              />
            </svg>
            <input
              type="search"
              value={searchTerm}
              placeholder="Search by store ID, name, or region"
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <select
            className="network-map__select"
            value={regionFilter}
            onChange={(event) => setRegionFilter(event.target.value)}
            aria-label="Filter by region"
          >
            <option value="all">All regions</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="network-map__status-row">
        {STATUS_ORDER.map((status) => (
          <button
            key={status}
            type="button"
            className="network-map__status-toggle"
            data-status={status}
            data-active={statusFilters[status]}
            onClick={() => toggleStatus(status)}
          >
            <span className="network-map__status-toggle-dot" />
            <span>{STATUS_LABEL[status]}</span>
            <span className="network-map__status-toggle-count">
              {filteredTotals.counts[status].toLocaleString()} / {networkTotals.counts[status].toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      <div className="network-map__kpi-grid">
        <div className="network-map__kpi-card">
          <span className="network-map__kpi-label">Locations in view</span>
          <span className="network-map__kpi-value">{filteredTotals.total.toLocaleString()}</span>
          <span className="network-map__kpi-subtext">
            Showing {visibleStores.length.toLocaleString()} of {filteredTotals.total.toLocaleString()}
            {hiddenCount > 0 ? ` • Narrow filters to see all (${hiddenCount.toLocaleString()} hidden)` : ""}
          </span>
        </div>
        <div className="network-map__kpi-card network-map__kpi-card--critical">
          <span className="network-map__kpi-label">Critical stores</span>
          <span className="network-map__kpi-value">{filteredTotals.counts.critical.toLocaleString()}</span>
          <span className="network-map__kpi-subtext">
            Network total {networkTotals.counts.critical.toLocaleString()}
          </span>
        </div>
        <div className="network-map__kpi-card">
          <span className="network-map__kpi-label">Average capacity</span>
          <span className="network-map__kpi-value">
            {Math.round(filteredTotals.avgCapacity * 100).toLocaleString()}%
          </span>
          <span className="network-map__kpi-subtext">
            Network baseline {Math.round(networkTotals.avgCapacity * 100).toLocaleString()}%
          </span>
        </div>
        <div className="network-map__kpi-card">
          <span className="network-map__kpi-label">Returns pending</span>
          <span className="network-map__kpi-value">{filteredTotals.returnsTotal.toLocaleString()}</span>
          <span className="network-map__kpi-subtext">
            Network total {networkTotals.returnsTotal.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="network-map__content">
        <section className="network-map__panel network-map__panel--region">
          <div className="network-map__section-header">
            <div>
              <h3>Regional breakdown</h3>
              <p>
                Sorted by exposure in the current view. Click any row in the list to drill into a store profile.
              </p>
            </div>
            <span className="network-map__section-count">
              {regionBreakdown.length.toLocaleString()} region{regionBreakdown.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="network-map__region-table-wrapper">
            <table className="network-map__region-table">
              <thead>
                <tr>
                  <th scope="col">Region</th>
                  <th scope="col">Stores</th>
                  <th scope="col">Critical</th>
                  <th scope="col">Watch</th>
                  <th scope="col">Healthy</th>
                  <th scope="col">Avg capacity</th>
                  <th scope="col">Returns</th>
                </tr>
              </thead>
              <tbody>
                {regionBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="network-map__table-empty">
                      No regions match the current filters.
                    </td>
                  </tr>
                ) : (
                  regionBreakdown.map((region) => (
                    <tr key={region.region}>
                      <th scope="row">{region.region}</th>
                      <td>{region.total.toLocaleString()}</td>
                      <td className="is-critical">{region.critical.toLocaleString()}</td>
                      <td className="is-watch">{region.watch.toLocaleString()}</td>
                      <td className="is-healthy">{region.healthy.toLocaleString()}</td>
                      <td>{Math.round(region.avgCapacity * 100).toLocaleString()}%</td>
                      <td>{region.returns.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="network-map__panel network-map__panel--list">
          <div className="network-map__section-header">
            <div>
              <h3>Store leaderboard</h3>
              <p>Ranked by severity and utilization. Select a store to open the detailed dashboard.</p>
            </div>
            <span className="network-map__section-count">
              {filteredTotals.total.toLocaleString()} match{filteredTotals.total === 1 ? "" : "es"}
            </span>
          </div>
          <div className="network-map__list-header">
            <span>ID</span>
            <span>Name</span>
            <span>Region</span>
            <span>Capacity</span>
            <span>Returns</span>
          </div>
          <div className="network-map__list-body">
            {visibleStores.length === 0 ? (
              <div className="network-map__list-empty">No stores match these filters. Adjust and try again.</div>
            ) : (
              visibleStores.map((store) => (
                <button
                  key={store.id}
                  type="button"
                  className="network-map__list-row"
                  data-status={store.status}
                  onClick={() => onSelect(store.id)}
                >
                  <span className="network-map__list-cell network-map__list-cell--id">{store.id}</span>
                  <span className="network-map__list-cell network-map__list-cell--name">{store.name}</span>
                  <span className="network-map__list-cell network-map__list-cell--region">{store.region}</span>
                  <span className="network-map__list-cell network-map__list-cell--capacity">
                    <span className="network-map__capacity-meter">
                      <span
                        className="network-map__capacity-fill"
                        data-status={store.status}
                        style={{
                          width: `${Math.min(Math.max(store.capacityPct, 0), 1.5) / 1.5 * 100}%`,
                        }}
                      />
                    </span>
                    <span className="network-map__capacity-value">
                      {Math.round(store.capacityPct * 100).toLocaleString()}%
                    </span>
                  </span>
                  <span className="network-map__list-cell network-map__list-cell--returns">
                    {store.returnsPending.toLocaleString()}
                  </span>
                </button>
              ))
            )}
            {hiddenCount > 0 && (
              <div className="network-map__list-footnote">
                {hiddenCount.toLocaleString()} additional store{hiddenCount === 1 ? "" : "s"} not shown. Narrow the
                filters or search to drill deeper.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
