"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CategorySummary, SkuPerformance, StoreTotals } from "@/lib/types";
import { useStore, type AgentActionState } from "@/lib/useStore";

type AgentMeta = {
  id: string;
  name?: string;
  region?: string;
  status?: string;
  capacityPct: number;
  inventoryHealth: number;
  totals: StoreTotals;
};

type NarrationEntry = {
  id: string;
  order: number;
  tone: "alert" | "calm" | "neutral" | "directive" | "suggestion";
  text: string;
  actionId?: string;
};

type LiveSummaryPanelProps = {
  storeId: string;
  baselineTotals: StoreTotals;
  baselineCapacityPct: number;
  baselineHealth: number;
};

const toneClass: Record<NarrationEntry["tone"] | "default", string> = {
  alert: "live-summary__message--alert",
  calm: "live-summary__message--calm",
  neutral: "live-summary__message--neutral",
  directive: "live-summary__message--directive",
  suggestion: "live-summary__message--suggestion",
  default: "live-summary__message--neutral",
};

function normalizeAction(action: AgentActionState): AgentActionState {
  return {
    ...action,
    remove: action.remove ?? [],
    add: action.add ?? [],
  };
}

export default function LiveSummaryPanel({
  storeId,
  baselineTotals,
  baselineCapacityPct,
  baselineHealth,
}: LiveSummaryPanelProps) {
  const agentFeedPath = process.env.NEXT_PUBLIC_AGENT_FEED ?? "/api/agent/mock";
  const setHighlight = useStore((state) => state.setHighlight);
  const setFilters = useStore((state) => state.setFilters);
  const setActiveAction = useStore((state) => state.setActiveAction);
  const appendConversation = useStore((state) => state.appendConversation);
  const clearConversation = useStore((state) => state.clearConversation);
  const upsertAction = useStore((state) => state.upsertAction);
  const removeAction = useStore((state) => state.removeAction);
  const setActionStatus = useStore((state) => state.setActionStatus);
  const actionStatuses = useStore((state) => state.actionStatuses);
  const actions = useStore((state) => state.actions);
  const conversation = useStore((state) => state.conversation);
  const clearActions = useStore((state) => state.clearActions);
  const hasHeardIntro = useStore((state) => state.hasHeardIntro);
  const setHasHeardIntro = useStore((state) => state.setHasHeardIntro);

  const [status, setStatus] = useState<"idle" | "listening" | "complete" | "error">("idle");
  const [meta, setMeta] = useState<AgentMeta>({
    id: storeId,
    capacityPct: baselineCapacityPct,
    inventoryHealth: baselineHealth,
    totals: baselineTotals,
  });
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [context, setContext] = useState<{ categories: CategorySummary[]; skuPerformance: SkuPerformance[] }>({
    categories: [],
    skuPerformance: [],
  });
  const [introAudioUrl, setIntroAudioUrl] = useState<string | null>(null);
  const [introAutoplayFailed, setIntroAutoplayFailed] = useState(false);

  useEffect(() => {
    let source: EventSource | null = null;
    let cancelled = false;

    const baseUrl = `${agentFeedPath}?storeId=${encodeURIComponent(storeId)}`;
    const streamUrl = `${baseUrl}&mode=stream`;

    const resetState = () => {
      setStatus("listening");
      clearConversation();
      setActiveActionId(null);
      setActiveAction(null);
      setHighlight(undefined);
      setFilters({ categories: [] });
      clearActions();
      setHasHeardIntro(false);
      setIntroAudioUrl(null);
      setContext({ categories: [], skuPerformance: [] });
      setMeta({
        id: storeId,
        capacityPct: baselineCapacityPct,
        inventoryHealth: baselineHealth,
        totals: baselineTotals,
      });
    };

    const ingestPayload = (payload: {
      store: AgentMeta;
      categories: CategorySummary[];
      skuPerformance: SkuPerformance[];
      narration: NarrationEntry[];
      actions: AgentActionState[];
      generatedAt: string;
    }) => {
      setMeta(payload.store);
      setContext({ categories: payload.categories, skuPerformance: payload.skuPerformance });
      payload.narration
        .slice()
        .sort((a, b) => a.order - b.order)
        .forEach((entry) => {
          appendConversation({
            id: entry.id,
            role: "agent",
            text: entry.text,
            actionId: entry.actionId ?? undefined,
            timestamp: new Date().toISOString(),
            tone: entry.tone,
          });
        });
      (payload.actions ?? []).forEach((action) => {
        const normalized = normalizeAction(action);
        upsertAction(normalized);
        const currentStatus = useStore.getState().actionStatuses[action.id];
        if (!currentStatus || currentStatus === "pending") {
          setActionStatus(action.id, "pending");
        }
      });
    };

    const handleFallbackFetch = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(baseUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to fetch snapshot (${res.status})`);
        const snapshot = await res.json();
        if (cancelled) return;
        ingestPayload(snapshot);
        setStatus("complete");
      } catch (error) {
        console.error("Agent snapshot fallback failed", error);
        if (!cancelled) {
          setStatus("error");
        }
      }
    };

    const connectStream = () => {
      resetState();

      if (typeof window === "undefined" || typeof EventSource === "undefined") {
        handleFallbackFetch();
        return;
      }

      source = new EventSource(streamUrl);
      source.addEventListener("meta", (event) => {
        if (cancelled) return;
        const payload = JSON.parse(event.data) as { store: AgentMeta };
        setMeta(payload.store);
      });
      source.addEventListener("categories", (event) => {
        if (cancelled) return;
        const data = JSON.parse(event.data) as CategorySummary[];
        setContext((prev) => ({ ...prev, categories: data }));
      });
      source.addEventListener("skuPerformance", (event) => {
        if (cancelled) return;
        const data = JSON.parse(event.data) as SkuPerformance[];
        setContext((prev) => ({ ...prev, skuPerformance: data }));
      });
      source.addEventListener("narration", (event) => {
        if (cancelled) return;
        const entry = JSON.parse(event.data) as NarrationEntry;
        appendConversation({
          id: entry.id,
          role: "agent",
          text: entry.text,
          actionId: entry.actionId ?? undefined,
          tone: entry.tone,
        });
      });
      source.addEventListener("action", (event) => {
        if (cancelled) return;
        const action = normalizeAction(JSON.parse(event.data) as AgentActionState);
        upsertAction(action);
        const currentStatus = useStore.getState().actionStatuses[action.id];
        if (!currentStatus || currentStatus === "pending") {
          setActionStatus(action.id, "pending");
        }
      });
      source.addEventListener("complete", () => {
        if (!cancelled) {
          setStatus("complete");
        }
        source?.close();
      });
      source.onerror = () => {
        source?.close();
        if (!cancelled) {
          handleFallbackFetch();
        }
      };
    };

    connectStream();

    return () => {
      cancelled = true;
      source?.close();
    };
  }, [
    agentFeedPath,
    baselineCapacityPct,
    baselineHealth,
    baselineTotals,
    clearActions,
    clearConversation,
    appendConversation,
    setActionStatus,
    setActiveAction,
    setFilters,
    setHighlight,
    storeId,
    upsertAction,
  ]);

  useEffect(() => {
    if (!activeActionId) {
      setActiveAction(null);
      setHighlight(undefined);
      setFilters({ categories: [] });
      return;
    }
    const active = actions.find((action) => action.id === activeActionId);
    if (!active) return;
    setActiveAction(active);
    setHighlight(active.targetCategory);
    setFilters({ categories: [active.targetCategory] });
  }, [activeActionId, actions, setActiveAction, setFilters, setHighlight]);

  const orderedActions = useMemo(() => {
    const severityOrder = { high: 0, medium: 1, low: 2 } as const;
    return [...actions].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }, [actions]);

  const actionableActions = useMemo(
    () =>
      orderedActions.filter((action) => {
        const status = actionStatuses[action.id] ?? "pending";
        return status !== "applied" && status !== "dismissed";
      }),
    [orderedActions, actionStatuses],
  );

  const pendingCount = actionableActions.length;

  useEffect(() => {
    if (hasHeardIntro || introAudioUrl || status !== "complete") return;

    if (!meta || conversation.length === 0) return;

    const recommendations = actionableActions.slice(0, 2).map((action) => {
      return `${action.shiftPct}% from ${action.sourceCategory} to ${action.targetCategory}`;
    });

    const summaryParts: string[] = [];
    summaryParts.push(
      `Store ${meta.name ?? meta.id} is operating at ${Math.round(meta.capacityPct * 100)} percent capacity with a health score of ${meta.inventoryHealth}.`,
    );
    if (recommendations.length) {
      summaryParts.push(`Recommended actions include shifting ${recommendations.join(" and ")}.`);
    } else {
      const firstAgentMessage = conversation.find((message) => message.role === "agent" && message.text?.length);
      if (firstAgentMessage) {
        summaryParts.push(firstAgentMessage.text);
      }
    }

    const narration = summaryParts.join(" ");
    if (!narration.trim()) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/voice/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: narration, storeId }),
        });
        if (!res.ok) {
          console.error("Failed to fetch summary audio", res.status, await res.text());
          return;
        }
        const blob = await res.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setIntroAudioUrl(url);
      } catch (error) {
        console.error("Summary narration audio failed", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasHeardIntro, introAudioUrl, status, meta, conversation, actionableActions, storeId]);

  useEffect(() => {
    if (!introAudioUrl || hasHeardIntro) return;
    const audio = new Audio(introAudioUrl);
    audio.volume = 0.9;
    const play = async () => {
      try {
        await audio.play();
        setHasHeardIntro(true);
        setIntroAutoplayFailed(false);
      } catch (error) {
        console.warn("Autoplay blocked for summary audio", error);
        setIntroAutoplayFailed(true);
        setHasHeardIntro(true);
      }
    };
    void play();
    return () => {
      audio.pause();
    };
  }, [introAudioUrl, hasHeardIntro, setHasHeardIntro]);

  useEffect(() => {
    if (!introAudioUrl) return () => {};
    return () => {
      URL.revokeObjectURL(introAudioUrl);
    };
  }, [introAudioUrl]);

  const messages = useMemo(() => conversation.slice(-40), [conversation]);

  const connectionLabel = useMemo(() => {
    switch (status) {
      case "idle":
        return "Idle";
      case "listening":
        return "Listening...";
      case "complete":
        return "Summary ready";
      case "error":
        return "Offline";
      default:
        return "Idle";
    }
  }, [status]);

  const handleReview = (action: AgentActionState) => {
    setActionStatus(action.id, "in_review");
    setActiveActionId(action.id);
  };

  const handleDismiss = (action: AgentActionState) => {
    setActionStatus(action.id, "dismissed");
    appendConversation({
      role: "system",
      text: `Dismissed recommendation to shift ${action.shiftPct}% from ${action.sourceCategory} to ${action.targetCategory}.`,
      actionId: action.id,
    });
    if (activeActionId === action.id) {
      setActiveActionId(null);
      setActiveAction(null);
    }
    removeAction(action.id);
  };

  const replaySummary = () => {
    if (!introAudioUrl) return;
    const audio = new Audio(introAudioUrl);
    audio.volume = 0.9;
    void audio
      .play()
      .then(() => {
        setHasHeardIntro(true);
        setIntroAutoplayFailed(false);
      })
      .catch((error) => {
        console.warn("Replay blocked", error);
        setIntroAutoplayFailed(true);
      });
  };

  return (
    <motion.section
      className="live-summary"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <header className="live-summary__header">
        <div>
          <p className="live-summary__eyebrow">Conversational agent</p>
          <h2 className="live-summary__title">{meta.name ?? meta.id}</h2>
          <p className="live-summary__subtitle">
            {meta.region ? `${meta.region} • ` : ""}
            Capacity {Math.round(meta.capacityPct * 100)}% • Health {meta.inventoryHealth}
          </p>
        </div>
      <div className={`live-summary__status live-summary__status--${status}`}>
        <span className="indicator" />
        {connectionLabel}
      </div>
      <button
        type="button"
        className="live-summary__replay"
        onClick={replaySummary}
        disabled={!introAudioUrl}
      >
        Replay summary
      </button>
      {introAutoplayFailed && <span className="live-summary__audio-hint">Tap replay to hear the briefing</span>}
    </header>

      <div className="live-summary__body">
        <div className="live-summary__stream">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                className={`live-summary__message ${toneClass[message.tone ?? "default"]} live-summary__message--${message.role}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="live-summary__message-meta">
                  <span className="role">
                    {message.role === "agent" ? "Pulse" : message.role === "user" ? "You" : "System"}
                  </span>
                  <span className="time">{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p>{message.text}</p>
              </motion.div>
            ))}
          </AnimatePresence>
          {status === "error" && (
            <div className="live-summary__error">
              Unable to contact the agent feed. Using the latest snapshot—refresh to retry streaming.
            </div>
          )}
        </div>

        <div className="live-summary__actions">
          <div className="live-summary__actions-header">
            <h3>Review exceptions</h3>
            <span>{pendingCount} ready</span>
          </div>
          <AnimatePresence>
            {actionableActions.map((action, index) => {
              const statusLabel = actionStatuses[action.id] ?? "pending";
              const isApplied = statusLabel === "applied";
              const isDismissed = statusLabel === "dismissed";
              return (
                <motion.div
                  key={action.id}
                  className={`live-summary__action-card live-summary__action-card--${action.severity} ${
                    activeActionId === action.id ? "is-active" : ""
                  } ${isApplied ? "is-complete" : ""} ${isDismissed ? "is-dismissed" : ""}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ delay: index * 0.08, duration: 0.35, ease: "easeOut" }}
                >
                  <div className="live-summary__action-head">
                    <span className="pill">{action.severity.toUpperCase()}</span>
                    <span className="pill pill--muted">{action.type}</span>
                    <span className={`pill pill--status pill--status-${statusLabel}`}>{statusLabel}</span>
                  </div>
                  <h4>{action.title}</h4>
                  <p>{action.summary}</p>
                  <div className="live-summary__action-detail">
                    <div>
                      <span className="label">Shift %</span>
                      <span className="value">{action.shiftPct}%</span>
                    </div>
                    <div>
                      <span className="label">From</span>
                      <span className="value">{action.sourceCategory}</span>
                    </div>
                    <div>
                      <span className="label">To</span>
                      <span className="value">{action.targetCategory}</span>
                    </div>
                  </div>
                  <div className="live-summary__action-skus">
                    <div>
                      <span className="label">Trim</span>
                      <ul>
                        {(action.remove ?? []).map((sku) => (
                          <li key={sku.id}>
                            {sku.name} <em>#{sku.ranking}</em>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="label">Backfill</span>
                      <ul>
                        {(action.add ?? []).map((sku) => (
                          <li key={sku.id}>
                            {sku.name} <em>{sku.fitScore}% fit</em>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="live-summary__action-footer">
                    <button
                      type="button"
                      onClick={() => handleReview(action)}
                      disabled={isApplied || isDismissed}
                    >
                      Open review
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => handleDismiss(action)}
                      disabled={isApplied || isDismissed}
                    >
                      Dismiss
                    </button>
                  </div>
                </motion.div>
              );
            })}
            {orderedActions.length === 0 && status !== "error" && (
              <motion.div
                key="empty"
                className="live-summary__empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Awaiting agent recommendations...
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}
