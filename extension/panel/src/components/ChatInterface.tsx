import { useState, useRef, useEffect } from "react";
import { useStore } from "../store";
import type { ChatMessage } from "../../../shared/types";

interface Props {
  repoId: string;
}

const SUGGESTED_QUESTIONS = [
  "How does authentication work?",
  "What's the database schema?",
  "How do I add a new API endpoint?",
  "What are the main design patterns used?",
  "Where is the business logic?",
];

export function ChatInterface({ repoId }: Props) {
  const { chatMessages, addChatMessage } = useStore();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMessages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    };

    addChatMessage(userMsg);
    setInput("");
    setIsLoading(true);

    try {
      const response = await new Promise<string>((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: "CHAT_MESSAGE",
            payload: { repoId, message: text.trim(), history: chatMessages },
          },
          (res) => {
            if (res?.ok) resolve(res.response);
            else reject(new Error(res?.error ?? "Chat failed"));
          }
        );
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };

      addChatMessage(assistantMsg);
    } catch {
      addChatMessage({
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I couldn't process that. Please try again.",
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)" }}>
      {/* Messages */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: "var(--space-md)" }}
      >
        {chatMessages.length === 0 && (
          <div style={{ textAlign: "center", padding: "var(--space-xl)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "var(--space-md)" }}>💬</div>
            <h3 style={{ fontSize: "0.95rem", marginBottom: "var(--space-sm)" }}>
              Ask anything about this repo
            </h3>
            <p style={{ fontSize: "0.8rem", marginBottom: "var(--space-lg)" }}>
              AI answers are grounded in the actual codebase structure.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  className="btn btn--ghost btn--sm"
                  style={{ justifyContent: "flex-start", fontSize: "0.8rem" }}
                  onClick={() => sendMessage(q)}
                >
                  💡 {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "85%",
                padding: "var(--space-sm) var(--space-md)",
                borderRadius: "var(--radius-lg)",
                background: msg.role === "user" ? "var(--accent-light)" : "var(--bg-tertiary)",
                border: `1px solid ${msg.role === "user" ? "var(--border-accent)" : "var(--border-subtle)"}`,
                fontSize: "0.85rem",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "var(--space-sm) var(--space-md)",
                borderRadius: "var(--radius-lg)",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-subtle)",
                fontSize: "0.85rem",
                color: "var(--text-tertiary)",
              }}
            >
              <span className="animate-pulse-glow" style={{ display: "inline-block" }}>
                Thinking...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-sm)",
          padding: "var(--space-md) 0 0",
          borderTop: "1px solid var(--border-primary)",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="Ask about this codebase..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: "var(--space-sm) var(--space-md)",
            border: "1px solid var(--border-primary)",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-tertiary)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
            fontSize: "0.85rem",
            outline: "none",
          }}
        />
        <button
          className="btn btn--primary btn--sm"
          onClick={() => sendMessage(input)}
          disabled={isLoading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
