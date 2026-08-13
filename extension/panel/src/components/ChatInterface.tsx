import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, CircleAlert, LoaderCircle, MessageSquareText, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "../../../shared/types";

interface Props {
  repoId: string;
}

interface ChatResponse {
  ok?: boolean;
  response?: unknown;
  error?: string;
}

const SUGGESTED_QUESTIONS = [
  "How does authentication work?",
  "What is the database schema?",
  "How do I add a new API endpoint?",
  "Which design patterns shape this repository?",
  "Where does the core business logic live?",
];

const MAX_STORED_MESSAGES = 50;

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<ChatMessage>;
  return (
    typeof candidate.id === "string" &&
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string" &&
    typeof candidate.timestamp === "number"
  );
}

function createMessage(
  role: ChatMessage["role"],
  content: string,
  prefix: string = role
): ChatMessage {
  return {
    id: `${prefix}-${crypto.randomUUID()}`,
    role,
    content,
    timestamp: Date.now(),
  };
}

function persistMessages(storageKey: string, messages: ChatMessage[]): void {
  void chrome.storage.local
    .set({ [storageKey]: messages.slice(-MAX_STORED_MESSAGES) })
    .catch(() => undefined);
}

export function ChatInterface({ repoId }: Props) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRepoRef = useRef(repoId);
  const storageKey = `chat:${repoId}`;

  useEffect(() => {
    activeRepoRef.current = repoId;
    let cancelled = false;

    setChatMessages([]);
    setInput("");
    setIsLoading(false);
    setIsRestoring(true);

    void chrome.storage.local
      .get(storageKey)
      .then((result) => {
        if (cancelled) return;

        const stored = result[storageKey];
        const restored = Array.isArray(stored) ? stored.filter(isChatMessage) : [];
        setChatMessages(restored.slice(-MAX_STORED_MESSAGES));
      })
      .catch(() => {
        if (!cancelled) setChatMessages([]);
      })
      .finally(() => {
        if (!cancelled) setIsRestoring(false);
      });

    return () => {
      cancelled = true;
    };
  }, [repoId, storageKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatMessages, isLoading]);

  const sendMessage = async (text: string) => {
    const normalized = text.trim();
    if (!normalized || isLoading || isRestoring) return;

    const requestRepoId = repoId;
    const requestStorageKey = storageKey;
    const previousMessages = chatMessages;
    const userMessage = createMessage("user", normalized);
    const withUser = [...previousMessages, userMessage].slice(-MAX_STORED_MESSAGES);

    setChatMessages(withUser);
    persistMessages(requestStorageKey, withUser);
    setInput("");
    setIsLoading(true);

    try {
      const response = await new Promise<string>((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: "CHAT_MESSAGE",
            payload: {
              repoId: requestRepoId,
              message: normalized,
              history: previousMessages,
            },
          },
          (result: ChatResponse | undefined) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }

            if (result?.ok && typeof result.response === "string") {
              resolve(result.response);
              return;
            }

            reject(new Error(result?.error ?? "Chat failed"));
          }
        );
      });

      const assistantMessage = createMessage("assistant", response);
      const completed = [...withUser, assistantMessage].slice(-MAX_STORED_MESSAGES);
      persistMessages(requestStorageKey, completed);

      if (activeRepoRef.current === requestRepoId) {
        setChatMessages(completed);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "The request could not be completed.";
      const errorMessage = createMessage(
        "assistant",
        `I could not answer that question. ${message}`,
        "error"
      );
      const completed = [...withUser, errorMessage].slice(-MAX_STORED_MESSAGES);
      persistMessages(requestStorageKey, completed);

      if (activeRepoRef.current === requestRepoId) {
        setChatMessages(completed);
      }
    } finally {
      if (activeRepoRef.current === requestRepoId) {
        setIsLoading(false);
      }
    }
  };

  return (
    <section
      aria-label="Repository chat"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 420,
        height: "calc(100vh - 160px)",
        border: "1px solid var(--border-primary)",
        borderRadius: "var(--radius-sm)",
        background: "var(--bg-card)",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-sm)",
          padding: "var(--space-md) var(--space-lg)",
          borderBottom: "1px solid var(--border-primary)",
        }}
      >
        <MessageSquareText size={17} aria-hidden="true" />
        <div>
          <p
            style={{
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.64rem",
              fontWeight: 600,
              letterSpacing: "0.14em",
              lineHeight: 1.2,
              textTransform: "uppercase",
            }}
          >
            Repository context
          </p>
          <h2
            style={{
              marginTop: 2,
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontSize: "1rem",
              fontWeight: 500,
            }}
          >
            Ask RepoMind
          </h2>
        </div>
      </header>

      <div
        ref={scrollRef}
        aria-live="polite"
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-md)",
          padding: "var(--space-lg)",
        }}
      >
        {!isRestoring && chatMessages.length === 0 && (
          <div style={{ margin: "auto 0", padding: "var(--space-md) 0" }}>
            <h3
              style={{
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: "1.25rem",
                fontWeight: 500,
                letterSpacing: "-0.02em",
              }}
            >
              Explore the codebase in conversation.
            </h3>
            <p style={{ marginTop: "var(--space-xs)", fontSize: "0.8rem" }}>
              Answers use the repository analysis currently open in this panel.
            </p>
            <div style={{ display: "grid", gap: "var(--space-xs)", marginTop: "var(--space-lg)" }}>
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  className="btn btn--ghost btn--sm"
                  style={{
                    justifyContent: "space-between",
                    minHeight: 38,
                    textAlign: "left",
                    whiteSpace: "normal",
                  }}
                  onClick={() => void sendMessage(question)}
                >
                  <span>{question}</span>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        )}

        {isRestoring && (
          <div
            style={{
              margin: "auto",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-sm)",
              color: "var(--text-tertiary)",
              fontSize: "0.78rem",
            }}
          >
            <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />
            Restoring this repository&apos;s conversation
          </div>
        )}

        {chatMessages.map((message) => {
          const isUser = message.role === "user";
          const isError = message.id.startsWith("error-");

          return (
            <article
              key={message.id}
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  width: "fit-content",
                  maxWidth: "90%",
                  padding: "var(--space-sm) var(--space-md)",
                  borderRadius: "var(--radius-sm)",
                  background: isUser ? "var(--accent-light)" : "var(--bg-tertiary)",
                  border: `1px solid ${
                    isError
                      ? "var(--danger)"
                      : isUser
                        ? "var(--border-accent)"
                        : "var(--border-subtle)"
                  }`,
                  color: "var(--text-primary)",
                  fontSize: "0.82rem",
                  lineHeight: 1.65,
                  overflowWrap: "anywhere",
                }}
              >
                {isError && (
                  <CircleAlert
                    size={14}
                    color="var(--danger)"
                    aria-hidden="true"
                    style={{ marginBottom: "var(--space-xs)" }}
                  />
                )}
                {isUser ? (
                  <span style={{ whiteSpace: "pre-wrap" }}>{message.content}</span>
                ) : (
                  <div className="markdown-body">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ node, ...props }) => {
                          void node;
                          return <a {...props} target="_blank" rel="noopener noreferrer" />;
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {isLoading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-sm)",
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <LoaderCircle className="animate-spin" size={15} aria-hidden="true" />
            Reading the analysis
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage(input);
        }}
        style={{
          display: "flex",
          gap: "var(--space-sm)",
          padding: "var(--space-md)",
          borderTop: "1px solid var(--border-primary)",
          background: "var(--bg-secondary)",
        }}
      >
        <label htmlFor="repomind-chat-input" style={{ position: "absolute", left: -10_000 }}>
          Ask a question about this repository
        </label>
        <input
          id="repomind-chat-input"
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about this codebase"
          disabled={isLoading || isRestoring}
          autoComplete="off"
          style={{
            flex: 1,
            minWidth: 0,
            padding: "var(--space-sm) var(--space-md)",
            border: "1px solid var(--border-primary)",
            borderRadius: "var(--radius-sm)",
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
            fontSize: "0.82rem",
            outline: "none",
          }}
        />
        <button
          type="submit"
          className="btn btn--primary btn--sm"
          disabled={isLoading || isRestoring || !input.trim()}
          aria-label="Send question"
          title="Send question"
        >
          <Send size={15} aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}
