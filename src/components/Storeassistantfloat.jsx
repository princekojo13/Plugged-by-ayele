
import { useState } from "react";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function StoreAssistantFloat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi there! 👋 Welcome to Plugged by Ayeley.\n\nI'm your shopping assistant. I can help you discover products, find prices and answer questions about delivery.\n\nWhat are you looking for today?",
    },
  ]);

  async function sendMessage(event) {
    event.preventDefault();

    const text = message.trim();

    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user", content: text }].slice(-8);
    setMessages(nextMessages);

    setMessage("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("store-assistant", {
        body: { messages: nextMessages },
      });

      if (error) throw error;
      if (!data?.success || typeof data?.message !== "string" || !data.message.trim()) {
        throw new Error("The assistant returned an invalid response.");
      }

      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: data.message },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: error?.message || "I'm sorry, I couldn't connect right now. Please try again shortly or use our WhatsApp chat for assistance.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-[6.25rem] right-5 z-[60] font-sans">
      {isOpen && (
        <section
          role="dialog"
          aria-label="Plugged by Ayeley shopping assistant"
          className="mb-4 flex h-[min(490px,65vh)] w-[min(360px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        >
          {/* Header */}
          <header className="flex items-center justify-between bg-rose-700 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/15 p-2">
                <Sparkles size={21} />
              </div>

              <div>
                <h2 className="font-semibold">
                  Store Assistant
                </h2>
                <p className="text-xs text-rose-100">
                  Plugged by Ayeley
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close assistant"
              className="rounded-full p-2 transition hover:bg-white/20"
            >
              <X size={20} />
            </button>
          </header>

          {/* Conversation */}
          <div
            className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((item, index) => (
              <div
                key={`${index}-${item.role}`}
                className={`max-w-[90%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                  item.role === "user"
                    ? "ml-auto rounded-br-sm bg-rose-700 text-white"
                    : "mr-auto rounded-bl-sm border border-gray-200 bg-white text-gray-800"
                }`}
              >
                {item.content}
              </div>
            ))}

            {loading && (
              <div className="mr-auto rounded-2xl border bg-white px-3 py-2.5 text-sm text-gray-500">
                Thinking...
              </div>
            )}
          </div>

          {/* Message input */}
          <form
            onSubmit={sendMessage}
            className="flex items-center gap-2 border-t border-gray-200 bg-white p-3"
          >
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask about our products..."
              aria-label="Type your message"
              maxLength={800}
              className="min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none transition focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
            />

            <button
              type="submit"
              disabled={!message.trim() || loading}
              aria-label="Send message"
              className="rounded-xl bg-rose-700 p-3 text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>

          <footer className="flex items-center justify-center gap-1 border-t bg-white px-3 py-2 text-xs text-gray-500">
            <ShoppingBag size={13} />
            <span>Shopping made easier</span>
          </footer>
        </section>
      )}

      {/* Floating button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen((previous) => !previous)}
          aria-label={
            isOpen ? "Close store assistant" : "Open store assistant"
          }
          aria-expanded={isOpen}
          className="flex items-center gap-2 rounded-full bg-rose-700 px-4 py-3.5 font-semibold text-white shadow-xl transition hover:scale-105 hover:bg-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2"
        >
          {isOpen ? (
            <X size={21} />
          ) : (
            <MessageCircle size={21} />
          )}
          <span>{isOpen ? "Close" : "Chatbot"}</span>
        </button>
      </div>
    </div>
  );
}
