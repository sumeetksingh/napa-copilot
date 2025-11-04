"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Recommendation = {
  id: string;
  title: string;
  description: string;
  savings?: number;
  discount?: number;
  unitsFreed?: number;
  actionLabel: string;
  type: "transfer" | "bundle" | "process" | "optimize";
  storeIds?: string[];
  storeCount?: number;
};

type SmartRecommendationsProps = {
  recommendations: Recommendation[];
  onExecute: (id: string) => void;
};

const typeIcons = {
  transfer: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
      />
    </svg>
  ),
  bundle: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  ),
  process: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  ),
  optimize: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  ),
};

export default function SmartRecommendations({
  recommendations,
  onExecute,
}: SmartRecommendationsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="smart-recommendations">
      <button
        className="smart-recommendations__toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="smart-recommendations__toggle-left">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <div className="smart-recommendations__toggle-info">
            <span className="label">SMART MOVES</span>
            <span className="subtitle">AI-powered recommendations</span>
          </div>
        </div>
        <div className="smart-recommendations__toggle-right">
          <span className="count">{recommendations.length}</span>
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

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="smart-recommendations__content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="smart-recommendations__list">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={rec.id}
                  className={`smart-rec-card smart-rec-card--${rec.type}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <div className="smart-rec-card__icon">{typeIcons[rec.type]}</div>

                  <div className="smart-rec-card__content">
                    <h4 className="smart-rec-card__title">{rec.title}</h4>
                    <p className="smart-rec-card__description">{rec.description}</p>

                    {rec.storeCount && rec.storeCount > 1 && (
                      <div className="smart-rec-card__stores">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        <span>{rec.storeCount} stores</span>
                      </div>
                    )}

                    <div className="smart-rec-card__metrics">
                      {rec.savings && (
                        <div className="metric">
                          <span className="metric__label">Saves:</span>
                          <span className="metric__value">${(rec.savings / 1000).toFixed(1)}K</span>
                        </div>
                      )}
                      {rec.discount && (
                        <div className="metric">
                          <span className="metric__label">Discount:</span>
                          <span className="metric__value">{rec.discount}%</span>
                        </div>
                      )}
                      {rec.unitsFreed && (
                        <div className="metric">
                          <span className="metric__label">Frees:</span>
                          <span className="metric__value">{rec.unitsFreed} units</span>
                        </div>
                      )}
                    </div>

                    <button
                      className="smart-rec-card__action"
                      onClick={() => onExecute(rec.id)}
                    >
                      {rec.actionLabel}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {recommendations.length === 0 && (
              <div className="smart-recommendations__empty">
                <p>No quick wins available right now. Check back soon!</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
