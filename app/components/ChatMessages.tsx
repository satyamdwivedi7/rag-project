"use client";
import { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Message } from "../types";

type Props = {
  messages: Message[];
  loading: boolean;
};

export default function ChatMessages({ messages, loading }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (messages.length <= 1) setExpandedId(null);
  }, [messages]);

  return (
    <div
      className="chat-scroll"
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "1rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
      }}
    >
      {messages.length === 0 && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--fg-muted)",
              fontFamily: "var(--font-body)",
              textAlign: "center",
            }}
          >
            Upload a document to begin
          </p>
        </div>
      )}

      {messages.map((m) => {
        if (m.role === "system") {
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: "center" }}>
              <span
                style={{
                  fontSize: "0.68rem",
                  color: "var(--fg-muted)",
                  fontFamily: "var(--font-body)",
                  padding: "0.25rem 0.6rem",
                  borderRadius: 20,
                  background: "var(--border-light)",
                  border: "1px solid var(--border)",
                }}
              >
                {m.text}
              </span>
            </div>
          );
        }

        // comparison card for compare-mode AI responses
        if (m.comparison) {
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ maxWidth: "90%", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <div
                  style={{
                    borderRadius: "16px 16px 16px 4px",
                    padding: "1rem 1.1rem",
                    background: "var(--ai-bg)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {m.comparison.sharedThemes.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: "0.6rem",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "var(--fg-muted)",
                          fontFamily: "var(--font-body)",
                          marginBottom: "0.4rem",
                        }}
                      >
                        Shared Themes
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "1.1rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                        {m.comparison.sharedThemes.map((t, ti) => (
                          <li
                            key={ti}
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--fg-secondary)",
                              fontFamily: "var(--font-body)",
                              lineHeight: 1.5,
                            }}
                          >
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {m.comparison.conflicts.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: "0.6rem",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "var(--fg-muted)",
                          fontFamily: "var(--font-body)",
                          marginBottom: "0.4rem",
                        }}
                      >
                        Conflicts
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "1.1rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                        {m.comparison.conflicts.map((c, ci) => (
                          <li
                            key={ci}
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--fg-secondary)",
                              fontFamily: "var(--font-body)",
                              lineHeight: 1.5,
                            }}
                          >
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {m.comparison.uniqueInsights.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: "0.6rem",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "var(--fg-muted)",
                          fontFamily: "var(--font-body)",
                          marginBottom: "0.4rem",
                        }}
                      >
                        Unique Insights
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        {m.comparison.uniqueInsights.map((u, ui) => (
                          <div
                            key={ui}
                            style={{
                              borderRadius: 6,
                              padding: "0.35rem 0.55rem",
                              background: "var(--bg-left)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.6rem",
                                color: "var(--accent)",
                                fontFamily: "var(--font-body)",
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                                marginRight: "0.5rem",
                              }}
                            >
                              {u.fileName}
                            </span>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--fg-secondary)",
                                fontFamily: "var(--font-body)",
                              }}
                            >
                              {u.insight}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div
                      style={{
                        fontSize: "0.6rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--fg-muted)",
                        fontFamily: "var(--font-body)",
                        marginBottom: "0.4rem",
                      }}
                    >
                      Synthesis
                    </div>
                    <div
                      className="prose prose-sm max-w-none
                        prose-p:my-1.5 prose-li:my-0.5
                        prose-headings:font-semibold prose-headings:text-[var(--fg)] prose-headings:mt-3 prose-headings:mb-1.5
                        prose-code:bg-[var(--bg-left)] prose-code:px-1 prose-code:rounded prose-code:text-[0.75rem]
                        prose-strong:text-[var(--fg)] prose-a:text-[var(--accent)]"
                      style={{ color: "var(--ai-fg)" }}
                    >
                      <ReactMarkdown>{m.comparison.synthesis}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        const isUser = m.role === "user";
        const hasCitations = !isUser && m.citations && m.citations.length > 0;
        const isExpanded = expandedId === m.id;

        return (
          <div
            key={m.id}
            style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}
          >
            <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <div
                style={{
                  borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding: "0.65rem 0.9rem",
                  fontSize: "0.83rem",
                  lineHeight: 1.6,
                  background: isUser ? "var(--user-bg)" : "var(--ai-bg)",
                  color: isUser ? "var(--user-fg)" : "var(--ai-fg)",
                  border: isUser
                    ? "1px solid var(--accent-rim)"
                    : "1px solid var(--border)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {isUser ? (
                  m.text
                ) : (
                  <div
                    className="prose prose-sm max-w-none
                      prose-p:my-1.5 prose-li:my-0.5
                      prose-headings:font-semibold prose-headings:text-[var(--fg)] prose-headings:mt-3 prose-headings:mb-1.5
                      prose-code:bg-[var(--bg-left)] prose-code:px-1 prose-code:rounded prose-code:text-[0.75rem]
                      prose-strong:text-[var(--fg)] prose-a:text-[var(--accent)]"
                    style={{ color: "var(--ai-fg)" }}
                  >
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                )}
              </div>

              {hasCitations && (
                <div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : m.id)}
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--fg-muted)",
                      fontFamily: "var(--font-body)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "0.1rem 0.25rem",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {isExpanded ? "Sources ↑" : "Sources ↓"}
                  </button>

                  {isExpanded && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                        marginTop: "0.2rem",
                      }}
                    >
                      {m.citations!.map((c, ci) => (
                        <div
                          key={ci}
                          style={{
                            borderRadius: 8,
                            padding: "0.55rem 0.7rem",
                            background: "var(--bg-left)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "0.72rem",
                              fontFamily: "monospace",
                              color: "var(--fg-secondary)",
                              lineHeight: 1.55,
                              marginBottom: "0.3rem",
                            }}
                          >
                            &ldquo;{c.excerpt}&rdquo;
                          </p>
                          <p
                            style={{
                              fontSize: "0.65rem",
                              fontFamily: "var(--font-body)",
                              color: "var(--fg-muted)",
                              letterSpacing: "0.02em",
                            }}
                          >
                            {c.relevance}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {loading && (
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <div
            style={{
              borderRadius: "16px 16px 16px 4px",
              padding: "0.65rem 1rem",
              background: "var(--ai-bg)",
              border: "1px solid var(--border)",
              display: "flex",
              gap: 5,
              alignItems: "center",
            }}
          >
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`dot dot-${n}`}
                style={{ width: 5, height: 5, background: "var(--accent)", opacity: 0.6 }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
