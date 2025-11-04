"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

type AgentActivity = {
  pendingOrders: number;
  pendingReturns: number;
  criticalAlerts: number;
  lastAction?: {
    description: string;
    timestamp: Date;
  };
};

export default function AgentStatusBar({ activity }: { activity: AgentActivity }) {
  const timeAgo = useMemo(() => {
    if (!activity.lastAction) return null;
    const now = new Date();
    const diff = now.getTime() - activity.lastAction.timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }, [activity.lastAction]);

  return (
    <motion.div
      className="agent-status-bar"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="agent-status-bar__header">
        <div className="agent-status-bar__icon">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
            />
          </svg>
        </div>
        <div className="agent-status-bar__title">
          <span className="label">AI Copilot Status</span>
          <span className="status-indicator">
            <span className="pulse-dot" />
            Active
          </span>
        </div>
      </div>

      <div className="agent-status-bar__metrics">
        <div className="status-metric status-metric--orders">
          <span className="status-metric__value">{activity.pendingOrders}</span>
          <span className="status-metric__label">Orders Pending</span>
        </div>
        <div className="status-metric status-metric--returns">
          <span className="status-metric__value">{activity.pendingReturns}</span>
          <span className="status-metric__label">Returns In Review</span>
        </div>
        <div className="status-metric status-metric--alerts">
          <span className="status-metric__value">{activity.criticalAlerts}</span>
          <span className="status-metric__label">Critical Alerts</span>
        </div>
      </div>

      {activity.lastAction && (
        <div className="agent-status-bar__activity">
          <span className="activity-label">Last Action:</span>
          <span className="activity-text">{activity.lastAction.description}</span>
          <span className="activity-time">{timeAgo}</span>
        </div>
      )}
    </motion.div>
  );
}
