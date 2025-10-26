"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Mic from "@/components/icons/Mic";
import { useStore, type AgentActionState, type ConversationMessage } from "@/lib/useStore";

type Mp3Recorder = {
  start: () => Promise<void>;
  stop: () => { getMp3: () => Promise<[BlobPart[], Blob]> };
};

type RecorderConstructor = new (options: { bitRate: number }) => Mp3Recorder;

type RecordStatus = "idle" | "recording" | "processing" | "error";

export default function ChatPanel({ storeId }: { storeId: string }) {
  const [text, setText] = useState("");
  const appendConversation = useStore((state) => state.appendConversation);
  const setActionStatus = useStore((state) => state.setActionStatus);
  const upsertAction = useStore((state) => state.upsertAction);
  const removeAction = useStore((state) => state.removeAction);
  const [recordStatus, setRecordStatus] = useState<RecordStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mountedRef = useRef(false);
  const recorderRef = useRef<Mp3Recorder | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    import("mic-recorder-to-mp3")
      .then((module) => {
        if (cancelled) return;
        const Recorder = (module.default ?? module) as RecorderConstructor;
        recorderRef.current = new Recorder({ bitRate: 128 });
      })
      .catch((error) => {
        console.error("Failed to load mic-recorder-to-mp3", error);
        if (mountedRef.current) {
          setErrorMessage("Microphone recording module failed to load.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCommand = useCallback(
    async (raw: string) => {
    const input = raw.trim();
    if (!input) return;
    const store = useStore.getState();
    const lower = input.toLowerCase();

    const pendingActions = store.actions.filter((action) => {
      const status = store.actionStatuses[action.id] ?? "pending";
      return status !== "applied" && status !== "dismissed";
    });

    const log = (text: string) =>
      store.appendConversation({ role: "system", text });

    if (lower.includes("dismiss")) {
      const target = pendingActions[0];
      if (target) {
        setActionStatus(target.id, "dismissed");
        removeAction(target.id);
        log(`Dismissed ${target.title}.`);
      } else {
        log("No pending recommendations to dismiss.");
      }
      return;
    }

    if (lower.includes("apply") || lower.includes("approve") || lower.includes("do it")) {
      const target = pendingActions[0];
      if (target) {
        store.applyShift(target);
        setActionStatus(target.id, "applied");
        removeAction(target.id);
        log(`Applied ${target.title}. Capacity updated.`);
      } else {
        log("No pending recommendations to apply.");
      }
      return;
    }

    const capacityMatch = lower.match(/(capacity|cap)[^0-9]*(\d{2,3})/);
    if (capacityMatch) {
      const targetValue = Number(capacityMatch[2]);
      if (!Number.isNaN(targetValue)) {
        store.setTargetCapacity(targetValue);
        const latest = useStore.getState();
        const baseline = latest.baseline?.capacityPct ?? 0;
        const current = latest.overrides.capacityOffset + baseline;
        log(`Targeting capacity near ${Math.round(current * 100)}% as requested.`);
      }
      return;
    }

    if (lower.includes("reset")) {
      store.resetOverrides();
      log("Restored store metrics to baseline values.");
      return;
    }

    try {
      const conversationHistory = store.conversation.slice(-8).map((entry) => ({
        role: entry.role,
        text: entry.text,
      }));

      const res = await fetch("/api/agent/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          instruction: input,
          conversation: conversationHistory,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        log((payload as { error?: string }).error ?? "Agent could not process the instruction.");
        return;
      }

      const payload = (await res.json()) as {
        narration?: Array<{ id: string; order: number; tone?: ConversationMessage["tone"]; text: string; actionId?: string }>;
        actions?: AgentActionState[];
        voiceSummary?: string;
      };

      payload.narration?.forEach((entry) => {
        appendConversation({
          id: entry.id,
          role: "agent",
          text: entry.text,
          actionId: entry.actionId,
          tone: entry.tone,
        });
      });

      payload.actions?.forEach((action) => {
        const normalized = {
          ...action,
          remove: action.remove ?? [],
          add: action.add ?? [],
        };
        upsertAction(normalized);
        setActionStatus(normalized.id, "pending");
      });

      const fallbackActionSummary = payload.actions?.length
        ? payload.actions
            .map((action) => `${action.title}. Shift ${action.shiftPct}% from ${action.sourceCategory} to ${action.targetCategory}.`)
            .join(" ")
        : "";
      const voiceSnippet =
        payload.voiceSummary ?? fallbackActionSummary || payload.narration?.map((entry) => entry.text).join(" ") ?? "";
      if (voiceSnippet.trim().length > 0) {
        try {
          const voiceRes = await fetch("/api/voice/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: voiceSnippet, storeId }),
          });
          if (voiceRes.ok) {
            const blob = await voiceRes.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            void audio.play().finally(() => URL.revokeObjectURL(url));
          }
        } catch (err) {
          console.warn("Voice playback failed", err);
        }
      }
    } catch (error) {
      console.error("Agent intent call failed", error);
      log("Agent is unavailable. Try again shortly.");
    }
    },
    [appendConversation, removeAction, setActionStatus, storeId, upsertAction]
  );

  const send = () => {
    if (!text.trim()) return;
    const message = text.trim();
    appendConversation({ role: "user", text: message });
    void handleCommand(message);
    setText("");
  };

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return;
    setRecordStatus("processing");
    try {
      const [buffer] = await recorderRef.current.stop().getMp3();
      if (!mountedRef.current) return;

      const audioFile = new File(buffer, "speech.mp3", {
        type: "audio/mpeg",
        lastModified: Date.now(),
      });

      const formData = new FormData();
      formData.append("file", audioFile);

      const res = await fetch("/api/agent/transcribe", {
        method: "POST",
        body: formData,
      });

      let transcript = "";
      if (res.ok) {
        const data = (await res.json()) as { text?: string };
        transcript = data.text?.trim() ?? "";
      } else {
        const errorPayload = await res.json().catch(() => ({}));
        const detail = (errorPayload as { error?: string; detail?: string }).detail;
        setErrorMessage(detail ? `Speech-to-text failed: ${detail}` : "Speech-to-text failed. Try again.");
      }

      if (transcript) {
        appendConversation({ role: "user", text: transcript });
        await handleCommand(transcript);
      } else {
        setErrorMessage("Couldn't understand audio—try again.");
      }
    } catch (error) {
      console.error("Recording failed", error);
      if (mountedRef.current) {
        setErrorMessage("Microphone error—check permissions and retry.");
      }
    } finally {
      if (mountedRef.current) {
        setRecordStatus("idle");
      }
    }
  }, [appendConversation, handleCommand, setErrorMessage, setRecordStatus]);

  const startRecording = async () => {
    if (!recorderRef.current) {
      setErrorMessage("Recorder not ready yet.");
      return;
    }
    try {
      setErrorMessage(null);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await recorderRef.current.start();
      if (mountedRef.current) {
        setRecordStatus("recording");
      }
    } catch (error) {
      console.error("Failed to start recording", error);
      if (mountedRef.current) {
        setRecordStatus("error");
        setErrorMessage("Microphone not available or permission denied.");
      }
    }
  };

  useEffect(() => {
    const handleKeyUp = async (event: KeyboardEvent) => {
      if (event.code === "Space" && recordStatus === "recording") {
        await stopRecording();
      }
    };
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [recordStatus, stopRecording]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      send();
    }
  };

  return (
    <div className="p-4 space-y-3 text-white/90">
      <div className="text-[12px] text-white/60">
        Try: “add brake pads”, “remove ACME”, “under ten on hand”.
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-xl bg-[#0a1020]/60 backdrop-blur-md ring-1 ring-[#163162] focus-within:ring-sky-500/70 transition-shadow shadow-[inset_0_0_0_1px_rgba(22,49,98,0.3)]">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a command…"
            className="w-full bg-transparent px-4 py-3 text-[15px] placeholder:text-white/40 focus:outline-none"
            aria-label="Chat message"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={send}
            aria-label="Send typed command"
            className="group relative select-none rounded-xl px-4 py-3
                       bg-gradient-to-br from-[#0d1b34] to-[#0a1427]
                       ring-1 ring-[#163162] hover:ring-sky-400/70
                       hover:from-[#0f2145] hover:to-[#0b1834]
                       active:scale-[0.98] transition
                       shadow-[0_6px_30px_rgba(2,132,199,0.15)]"
          >
            <div className="flex items-center gap-2">
              <span className="text-[15px] md:text-[16px] font-semibold tracking-wide text-white">
                Send
              </span>
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition
                            shadow-[0_0_30px_6px_rgba(2,132,199,0.25)]" />
          </button>
          <button
            type="button"
            onMouseDown={startRecording}
            onTouchStart={startRecording}
            onMouseUp={stopRecording}
            onTouchEnd={stopRecording}
            onMouseLeave={() => {
              if (recordStatus === "recording") {
                void stopRecording();
              }
            }}
            aria-label="Hold to talk"
            className={`group relative select-none rounded-xl px-4 py-3 transition shadow-[0_6px_30px_rgba(2,132,199,0.15)] ring-1 ring-[#163162] ${
              recordStatus === "recording"
                ? "bg-gradient-to-br from-[#be123c] to-[#9f1239] text-white"
                : "bg-gradient-to-br from-[#0d1b34] to-[#0a1427] text-sky-200 hover:ring-sky-400/70"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sky-300">
                <Mic className="w-6 h-6 md:w-7 md:h-7" />
              </span>
              <span className="text-[13px] md:text-[14px] font-semibold tracking-wide">
                {recordStatus === "recording" ? "Release to send" : "Hold to talk"}
              </span>
            </div>
          </button>
        </div>
      </div>

      <div className="text-[11px] text-white/45">
        Tip: Press <kbd className="px-1 py-0.5 bg-white/10 rounded border border-white/10">Enter</kbd> to send.
      </div>
      {recordStatus === "processing" && <div className="text-[11px] text-sky-300">Transcribing…</div>}
      {errorMessage && <div className="text-[11px] text-[#fca5a5]">{errorMessage}</div>}
    </div>
  );
}
