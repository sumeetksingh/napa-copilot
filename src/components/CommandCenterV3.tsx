"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { NetworkSummary, SuggestedAction } from "@/lib/types";
import ActionCard from "@/components/ActionCard";
import StoreNavigator from "@/components/StoreNavigator";
import SmartRecommendations from "@/components/SmartRecommendations";

export default function CommandCenterV3({ summary }: { summary: NetworkSummary }) {
  const router = useRouter();
  const [actions, setActions] = useState<SuggestedAction[]>(summary.suggested);
  const [activeTab, setActiveTab] = useState<"critical" | "all" | "completed">("critical");

  // Calculate metrics
  const metrics = useMemo(() => {
    const critical = actions.filter(a => a.impact?.timeSensitivity.urgency === 'critical' && a.status !== 'approved').length;
    const important = actions.filter(a => a.impact?.timeSensitivity.urgency === 'important' && a.status !== 'approved').length;
    const totalPending = actions.filter(a => a.status !== 'approved' && a.status !== 'dismissed').length;
    const completed = actions.filter(a => a.status === 'approved').length;

    return { critical, important, totalPending, completed };
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

  // Filter actions based on active tab
  const filteredActions = useMemo(() => {
    if (activeTab === 'critical') {
      return actions.filter(a => 
        a.impact?.timeSensitivity.urgency === 'critical' && 
        a.status !== 'approved' && 
        a.status !== 'dismissed'
      );
    } else if (activeTab === 'completed') {
      return actions.filter(a => a.status === 'approved');
    }
    return actions.filter(a => a.status !== 'approved' && a.status !== 'dismissed');
  }, [actions, activeTab]);

  return (
    <div className="cc-v3">
      {/* Hero Header with Status Overview */}
      <div className="cc-v3__hero">
        <div className="cc-v3__hero-content">
          <div className="cc-v3__hero-badge">
            <div className="pulse-dot" />
            <span>AI COPILOT ACTIVE</span>
          </div>
          <h1 className="cc-v3__hero-title">Action Command Center</h1>
          <p className="cc-v3__hero-subtitle">
            {metrics.totalPending} actions pending • {summary.stores.length} stores monitored
          </p>
        </div>

        {/* Quick Status Cards */}
        <div className="cc-v3__status-cards">
          <motion.div 
            className="status-card status-card--critical"
            whileHover={{ scale: 1.02 }}
          >
            <div className="status-card__icon">🔴</div>
            <div className="status-card__content">
              <div className="status-card__value">{metrics.critical}</div>
              <div className="status-card__label">Critical</div>
              <div className="status-card__sublabel">Immediate action needed</div>
            </div>
          </motion.div>

          <motion.div 
            className="status-card status-card--important"
            whileHover={{ scale: 1.02 }}
          >
            <div className="status-card__icon">🟡</div>
            <div className="status-card__content">
              <div className="status-card__value">{metrics.important}</div>
              <div className="status-card__label">Important</div>
              <div className="status-card__sublabel">24-48 hour window</div>
            </div>
          </motion.div>

          <motion.div 
            className="status-card status-card--completed"
            whileHover={{ scale: 1.02 }}
          >
            <div className="status-card__icon">✓</div>
            <div className="status-card__content">
              <div className="status-card__value">{metrics.completed}</div>
              <div className="status-card__label">Completed</div>
              <div className="status-card__sublabel">Actions applied today</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Store Navigator - Quick Access */}
      <StoreNavigator stores={summary.stores} onNavigate={handleNavigateToStore} />

      {/* Main Content Grid */}
      <div className="cc-v3__grid">
        {/* Primary Actions Panel */}
        <div className="cc-v3__primary">
          {/* Tab Navigation */}
          <div className="cc-v3__tabs">
            <button
              className={`cc-v3__tab ${activeTab === 'critical' ? 'active' : ''}`}
              onClick={() => setActiveTab('critical')}
            >
              <span className="tab-icon">🔴</span>
              <span className="tab-label">Critical</span>
              <span className="tab-count">{metrics.critical}</span>
            </button>
            <button
              className={`cc-v3__tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span className="tab-icon">📋</span>
              <span className="tab-label">All Actions</span>
              <span className="tab-count">{metrics.totalPending}</span>
            </button>
            <button
              className={`cc-v3__tab ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              <span className="tab-icon">✓</span>
              <span className="tab-label">Completed</span>
              <span className="tab-count">{metrics.completed}</span>
            </button>
          </div>

          {/* Actions List */}
          <div className="cc-v3__actions">
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
              <div className="cc-v3__empty">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3>All Clear!</h3>
                <p>
                  {activeTab === 'critical' 
                    ? 'No critical actions at this time.'
                    : activeTab === 'completed'
                    ? 'No completed actions yet.'
                    : 'No pending actions.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Smart Recommendations */}
        <div className="cc-v3__sidebar">
          <SmartRecommendations
            recommendations={smartRecommendations}
            onExecute={handleExecuteRecommendation}
          />
        </div>
      </div>
    </div>
  );
}
