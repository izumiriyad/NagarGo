"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

const QUICK = [
  "How does delivery work?",
  "How to become a rider?",
  "How is the fare calculated?",
  "How does OTP verification work?",
  "What is Medicine Express?",
  "How to pay with bKash?",
  "How does live tracking work?",
  "How to file a dispute?",
];

interface Msg { role: "user" | "assistant"; text: string; }

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", text: "Hi! I'm the NagarGo Assistant. Ask me anything about deliveries, payments, riders, or the app." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, loading]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const history = [...msgs, { role: "user" as const, text }];
    setMsgs(history);
    setInput("");
    setLoading(true);
    try {
      const res = await api<{ reply: string }>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: text, history: history.map((m) => ({ role: m.role, text: m.text })) }),
      });
      setMsgs((p) => [...p, { role: "assistant", text: res.reply || "I didn't understand that. Could you rephrase?" }]);
    } catch {
      setMsgs((p) => [...p, { role: "assistant", text: "Sorry, there was a problem. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }, [msgs, loading]);

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open NagarGo AI Assistant"
          className="fixed bottom-6 right-6 z-50 group flex items-center gap-2"
        >
          <span className="rounded-lg border border-ink/15 bg-white px-2.5 py-1.5 text-[11px] font-medium text-ink shadow-md text-right leading-tight opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Need help?
          </span>
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-route-green shadow-lg shadow-route-green/30 transition hover:bg-route-green-dark hover:-translate-y-0.5">
            <span className="absolute inset-0 rounded-2xl bg-route-green/30 animate-ping" style={{ animationDuration: "2.5s" }} />
            <span className="text-2xl relative">🤖</span>
          </span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed right-0 bottom-0 top-16 z-50 flex w-full max-w-sm flex-col border-l border-ink/10 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink/8 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-route-green text-lg">🤖</div>
                <div>
                  <p className="text-sm font-semibold text-ink">NagarGo Assistant</p>
                  <p className="text-xs text-ink/50">Powered by AI · Always available</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-black/5 transition" aria-label="Close">
                <svg className="h-5 w-5 text-ink/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-route-green text-white"
                        : "border border-ink/10 bg-[#F6F7F5] text-ink"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-xl border border-ink/10 bg-[#F6F7F5] px-3.5 py-2.5 text-sm text-ink/50">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-route-green" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-route-green" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-route-green" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              {/* Quick actions — only at start */}
              {msgs.length <= 1 && !loading && (
                <div className="pt-2">
                  <p className="mb-2 text-xs text-ink/40">Quick questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK.map((q) => (
                      <button
                        key={q}
                        onClick={() => send(q)}
                        className="rounded-lg border border-route-green/30 bg-route-green/5 px-3 py-1.5 text-xs font-medium text-route-green-dark transition hover:bg-route-green/10"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-ink/8 p-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
                  placeholder="Type your question…"
                  className="flex-1 rounded-xl border border-ink/15 px-3 py-2.5 text-sm outline-none focus:border-route-green/50"
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || loading}
                  aria-label="Send"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-route-green text-white disabled:opacity-40 hover:bg-route-green-dark transition"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
