"use client";
import React, { useState } from "react";
import Mic from "@/components/icons/Mic"; // if you don't have this, delete the <Mic/> span below

export default function ChatPanel() {
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    console.log("Sent:", text); // TODO: hook your submit
    setText("");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="p-4 space-y-3 text-white/90">
      <div className="text-[12px] text-white/60">
        Try: “add brake pads”, “remove ACME”, “under ten on hand”.
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-xl bg-[#0a1020]/60 backdrop-blur-md ring-1 ring-[#163162] focus-within:ring-sky-500/70 transition-shadow shadow-[inset_0_0_0_1px_rgba(22,49,98,0.3)]">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder="Type a command…"
            className="w-full bg-transparent px-4 py-3 text-[15px] placeholder:text-white/40 focus:outline-none"
            aria-label="Chat message"
          />
        </div>

        <button
          onClick={send}
          aria-label="Send (or hold to talk)"
          className="group relative select-none rounded-xl px-4 py-3
                     bg-gradient-to-br from-[#0d1b34] to-[#0a1427]
                     ring-1 ring-[#163162] hover:ring-sky-400/70
                     hover:from-[#0f2145] hover:to-[#0b1834]
                     active:scale-[0.98] transition
                     shadow-[0_6px_30px_rgba(2,132,199,0.15)]"
        >
          <div className="flex items-center gap-2">
            <span className="text-sky-300">
              <Mic className="w-6 h-6 md:w-7 md:h-7" />
            </span>
            <span className="text-[15px] md:text-[16px] font-semibold tracking-wide text-white">
              Send
            </span>
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition
                          shadow-[0_0_30px_6px_rgba(2,132,199,0.25)]" />
        </button>
      </div>

      {/* Helper hint */}
      <div className="text-[11px] text-white/45">
        Tip: Press <kbd className="px-1 py-0.5 bg-white/10 rounded border border-white/10">Enter</kbd> to send.
      </div>
    </div>
  );
}
