"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { NetworkSummary, SuggestedAction } from "@/lib/types";
import AgentStatusBar from "@/components/AgentStatusBar";
import ActionQueue from "@/components/ActionQueue";
import SmartRecommendations from "@/components/SmartRecommendations";
import StoreNavigator from "@/components/StoreNavigator";

export default function CommandCenter({ summary }: { summary: NetworkSummary }) {
  const router = useRouter();
  const [actions, setActions] = useState<SuggestedAction[]>(summary.suggested);

  // Calculate agent activity metrics
  const agentActivity = useMemo(() => {
    const pendingOrders = actions.filter(a => a.orders && a.orders.length > 0 && a.status !== 'approved').length;
    const pendingReturns = actions.filter(a => a.returns && a.returns.length > 0 && a.status !== 'approved').length;
    const criticalAlerts = actions.filter(a => a.impact?.timeSensitivity.urgency === 'critical').length;
    
    return {
      pendingOrders,
      pendingReturns,
      criticalAlerts,
      lastAction: {
        description: 'Rebalanced ATL_012 - Moved 5% from Other to Rotors',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      },
    };
  }, [actions]);

  // Smart recommendations - Store-centric bulk operations
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
    {
      id: 'rec-4',
      title: 'Transfer batteries ATL → NYC',
      description: '3 ATL stores have excess, 3 NYC stores need stock',
      savings: 4200,
      type: 'transfer' as const,
      actionLabel: 'Execute Transfer',
      storeIds: ['ATL_050', 'ATL_012', 'ATL_089', 'NYC_105', 'NYC_087', 'NYC_124'],
      storeCount: 6,
    },
  ], []);

  const handleApprove = useCallback((actionId: string) => {
    setActions(prev => prev.map(a => 
      a.id === actionId ? { ...a, status: 'approved' as const } : a
    ));
    // TODO: Make API call to approve action
    console.log('Approved action:', actionId);
  }, []);

  const handleDismiss = useCallback((actionId: string) => {
    setActions(prev => prev.map(a => 
      a.id === actionId ? { ...a, status: 'dismissed' as const } : a
    ));
    // TODO: Make API call to dismiss action
    console.log('Dismissed action:', actionId);
  }, []);

  const handleCustomize = useCallback((actionId: string) => {
    // TODO: Open customization modal
    console.log('Customize action:', actionId);
  }, []);

  const handleReview = useCallback((actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (action) {
      router.push(`/pulse/store/${action.storeId.toLowerCase()}`);
    }
  }, [actions, router]);

  const handleExecuteRecommendation = useCallback((recId: string) => {
    // TODO: Execute smart recommendation
    console.log('Execute recommendation:', recId);
  }, []);

  const handleNavigateToStore = useCallback((storeId: string) => {
    router.push(`/pulse/store/${storeId.toLowerCase()}`);
  }, [router]);

  // Filter out approved/dismissed actions
  const activeActions = useMemo(() => 
    actions.filter(a => a.status !== 'approved' && a.status !== 'dismissed'),
    [actions]
  );

  return (
    <div className="command-center-v2">
      {/* AI Agent Status Bar */}
      <AgentStatusBar activity={agentActivity} />

      {/* Store Navigator */}
      <StoreNavigator stores={summary.stores} onNavigate={handleNavigateToStore} />

      <div className="command-center-v2__body">
        {/* Main Action Queue */}
        <div className="command-center-v2__primary">
          <div className="command-center-v2__header">
            <div>
              <h1 className="command-center-v2__title">Action Command Center</h1>
              <p className="command-center-v2__subtitle">
                {activeActions.length} pending actions • {summary.stores.length} stores monitored • Updated{' '}
                {new Date(summary.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          <ActionQueue
            actions={activeActions}
            onApprove={handleApprove}
            onDismiss={handleDismiss}
            onCustomize={handleCustomize}
            onReview={handleReview}
          />
        </div>

        {/* Sidebar with Smart Recommendations */}
        <div className="command-center-v2__sidebar">
          <SmartRecommendations
            recommendations={smartRecommendations}
            onExecute={handleExecuteRecommendation}
          />

          {/* Quick Actions */}
          <div className="quick-actions">
            <h4 className="quick-actions__title">Quick Actions</h4>
            <div className="quick-actions__list">
              <button
                className="quick-action-btn"
                onClick={() => router.push("/pulse/store/atl_012")}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                View ATL_012
              </button>
              <button
                className="quick-action-btn"
                onClick={() => router.push("/pulse")}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Network Overview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
