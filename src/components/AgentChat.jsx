import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const AGENT_NAME = "order_assistant";

export default function AgentChat() {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  // Start a conversation when the panel first opens
  useEffect(() => {
    if (!open || conversationId) return;
    let active = true;
    setBusy(true);
    (async () => {
      try {
        const conv = await base44.agents.createConversation({
          agent_name: AGENT_NAME,
          metadata: { name: "Order Tracking Chat" },
        });
        if (!active) return;
        setConversationId(conv.id);
        setMessages(conv.messages || []);
      } catch (e) {
        if (active) setError(e?.message || "Could not start the assistant right now.");
      } finally {
        if (active) setBusy(false);
      }
    })();
    return () => { active = false; };
  }, [open, conversationId]);

  // Subscribe to streaming updates
  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
      setBusy(false);
    });
    return () => unsubscribe();
  }, [conversationId]);

  // Auto-scroll to latest
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  const send = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || !conversationId || busy) return;
    setInput("");
    setBusy(true);
    setError("");
    try {
      const conv = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conv, { role: "user", content: text });
    } catch (e) {
      setError(e?.message || "Failed to send message");
      setBusy(false);
    }
  };

  return (
    <>
      {/* Floating button (bottom-left so it never overlaps the WhatsApp button) */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 left-5 z-50 w-14 h-14 rounded-full bg-carbon text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Order assistant"
      >
        {open ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 left-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm h-[60vh] max-h-[480px] bg-white border border-border shadow-2xl flex flex-col animate-fade-up">
          {/* Header */}
          <div className="bg-carbon text-white px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-pink flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="font-heading font-bold text-sm leading-tight">Order Assistant</p>
              <p className="text-[11px] text-white/60">Track orders & delivery help</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-london/30">
            {messages.length === 0 && !error && (
              <div className="text-center text-xs text-muted-foreground py-8">
                <p className="mb-2">👋 Hi! I can help you track your order.</p>
                <p>Ask me &quot;Where is my order PBA-10001?&quot; or tell me the email you used at checkout.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] px-3 py-2 rounded-lg text-sm",
                    m.role === "user"
                      ? "bg-pink text-white"
                      : "bg-white border border-border text-carbon"
                  )}
                >
                  {m.role === "user" ? (
                    m.content
                  ) : (
                    <ReactMarkdown className="text-sm space-y-1">{m.content || ""}</ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="bg-white border border-border px-3 py-2 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            {error && <p className="text-xs text-red-600 text-center">{error}</p>}
          </div>

          {/* Input */}
          <form onSubmit={send} className="p-3 border-t border-border bg-white flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 bg-london border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink"
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              className="w-10 h-10 bg-pink text-white rounded-md flex items-center justify-center disabled:opacity-50 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}