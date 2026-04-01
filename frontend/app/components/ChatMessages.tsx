"use client";
import { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Message } from "../types";

export type { Message };

type Props = {
  messages: Message[];
  loading: boolean;
};

export default function ChatMessages({ messages, loading }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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

      {messages.map((m, i) => {
        if (m.role === "system") {
          return (
            <div key={i} style={{ display: "flex", justifyContent: "center" }}>
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

        const isUser = m.role === "user";
        return (
          <div
            key={i}
            style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}
          >
            <div
              style={{
                maxWidth: "80%",
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
                style={{
                  width: 5,
                  height: 5,
                  background: "var(--accent)",
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
