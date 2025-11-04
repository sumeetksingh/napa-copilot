"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { NetworkSummary, SuggestedAction } from "@/lib/types";
import ActionCard from "@/components/ActionCard";
import StoreNavigator from "@/components/StoreNavigator";
import SmartRecommendations from "@/components/SmartRecommendations";

export default function CommandCenterV4({ summary }: { summary: NetworkSummary }) {
  const router = useRouter();
  const [actions, setActions] = useState<SuggestedAction[]>(summary.suggested);
  const [activeFilter, setActiveFilter] = useState<"all" | "critical" | "important" | "completed">("all");

  // Calculate metrics
  const metrics = useMemo(() => {
    const critical = actions.filter(a => a.impact?.timeSensitivity.urgency === 'critical' && a.status !== 'approved' && a.status !== 'dismissed').length;
    const important = actions.filter(a => a.impact?.timeSensitivity.urgency === 'important' && a.status !== 'approved' && a.status !== 'dismissed').length;
    const pending = actions.filter(a => a.status !== 'approved' && a.status !== 'dismissed').length;
    const completed = actions.filter(a => a.status === 'approved').length;
    
    return { critical, important, pending, completed };
  }, [actions]);

  // Smart recommendations
  const smartRecommendations = useMemo(() => [
    {
      id: 'rec-1',
      title: 'Bulk optimize 8 Southeast stores',
      description: 'ATL, MIA cluster showing similar brake pad overstocking patterns',
      savings: 12400,
      type: 'optimize' as const,
      actionLabel: 'Optimize All Stores',
      storeIds: ['ATL_050', 'ATL_012', 'MIA_067', 'MIA_034', 'ATL_089', 'JAX_023', 'TPA_056', 'ORL_041'],
      storeCount: 8,
    },
    {
      id: 'rec-2',
      title: 'Process returns for 5 stores',
      description: 'DAL, HOU, AUS stores have collective 156 units ready for return',
      unitsFreed: 156,
      type: 'process' as const,
      actionLabel: 'Process All Returns',
      storeIds: ['DAL_044', 'HOU_078', 'AUS_092', 'SAT_033', 'DAL_056'],
      storeCount: 5,
    },
    {
      id: 'rec-3',
      title: 'Coordinate order for NYC cluster',
      description: '4 NYC stores need oil restock - bundle for 15% discount',
      discount: 15,
      type: 'bundle' as const,
      actionLabel: 'Create Bundle Order',
      storeIds: ['NYC_105', 'NYC_087', 'NYC_124', 'NYC_056'],
      storeCount: 4,
    },
  ], []);

  const handleApprove = useCallback((actionId: string) => {
    setActions(prev => prev.map(a => 
      a.id === actionId ? { ...a, status: 'approved' as const } : a
    ));
  }, []);

  const handleDismiss = useCallback((actionId: string) => {
    setActions(prev => prev.map(a => 
      a.id === actionId ? { ...a, status: 'dismissed' as const } : a
    ));
  }, []);

  const handleCustomize = useCallback((actionId: string) => {
    console.log('Customize:', actionId);
  }, []);

  const handleReview = useCallback((actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (action) {
      router.push(`/pulse/store/${action.storeId.toLowerCase()}`);
    }
  }, [actions, router]);

  const handleNavigateToStore = useCallback((storeId: string) => {
    router.push(`/pulse/store/${storeId.toLowerCase()}`);
  }, [router]);

  const handleExecuteRecommendation = useCallback((recId: string) => {
    console.log('Execute recommendation:', recId);
  }, []);

  // Filter actions
  const filteredActions = useMemo(() => {
    let filtered = actions;
    
    if (activeFilter === 'critical') {
      filtered = actions.filter(a => 
        a.impact?.timeSensitivity.urgency === 'critical' && 
        a.status !== 'approved' && 
        a.status !== 'dismissed'
      );
    } else if (activeFilter === 'important') {
      filtered = actions.filter(a => 
        a.impact?.timeSensitivity.urgency === 'important' && 
        a.status !== 'approved' && 
        a.status !== 'dismissed'
      );
    } else if (activeFilter === 'completed') {
      filtered = actions.filter(a => a.status === 'approved');
    } else {
      filtered = actions.filter(a => a.status !== 'approved' && a.status !== 'dismissed');
    }
    
    return filtered;
  }, [actions, activeFilter]);

  return (
    <div className="cc-v4">
      {/* Compact Header Bar */}
      <div className="cc-v4__topbar">
        <div className="cc-v4__topbar-left">
          <div className="cc-v4__status-badge">
            <div className="pulse-dot-sm" />
            <span>AI Active</span>
          </div>
          <h1 className="cc-v4__title">Command Center</h1>
          <span className="cc-v4__subtitle">
            {metrics.pending} pending • {summary.stores.length} stores
          </span>
        </div>

        {/* Inline Metrics */}
        <div className="cc-v4__metrics">
          <button
            className={`metric-chip metric-chip--critical ${activeFilter === 'critical' ? 'active' : ''}`}
            onClick={() => setActiveFilter('critical')}
          >
            <span className="metric-chip__icon">🔴</span>
            <span className="metric-chip__value">{metrics.critical}</span>
            <span className="metric-chip__label">Critical</span>
          </button>

          <button
            className={`metric-chip metric-chip--important ${activeFilter === 'important' ? 'active' : ''}`}
            onClick={() => setActiveFilter('important')}
          >
            <span className="metric-chip__icon">🟡</span>
            <span className="metric-chip__value">{metrics.important}</span>
            <span className="metric-chip__label">Important</span>
          </button>

          <button
            className={`metric-chip metric-chip--all ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            <span className="metric-chip__icon">📋</span>
            <span className="metric-chip__value">{metrics.pending}</span>
            <span className="metric-chip__label">All</span>
          </button>

          <button
            className={`metric-chip metric-chip--completed ${activeFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveFilter('completed')}
          >
            <span className="metric-chip__icon">✓</span>
            <span className="metric-chip__value">{metrics.completed}</span>
            <span className="metric-chip__label">Done</span>
          </button>
        </div>
      </div>

      {/* Store Navigator */}
      <div className="cc-v4__navigator">
        <StoreNavigator stores={summary.stores} onNavigate={handleNavigateToStore} />
      </div>

      {/* Main Grid */}
      <div className="cc-v4__grid">
        {/* Actions Column */}
        <div className="cc-v4__actions">
          {filteredActions.length > 0 ? (
            filteredActions.map((action, index) => (
              <ActionCard
                key={action.id}
                action={action}
                onApprove={handleApprove}
                onDismiss={handleDismiss}
                onCustomize={handleCustomize}
                onReview={handleReview}
                index={index}
              />
            ))
          ) : (
            <div className="cc-v4__empty">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>No actions in this category</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="cc-v4__sidebar">
          <SmartRecommendations
            recommendations={smartRecommendations}
            onExecute={handleExecuteRecommendation}
          />
        </div>
      </div>
    </div>
  );
}
