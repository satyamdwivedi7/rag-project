"use client";

type Props = {
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
  onSend: (directQuestion?: string) => void;
};

export default function ChatInput({ value, disabled, onChange, onSend }: Props) {
  return (
    <div
      style={{
        flexShrink: 0,
        padding: "0.75rem 1.25rem 1.25rem",
        borderTop: "1px solid var(--border-light)",
        background: "var(--bg)",
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <input
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) onSend(); }}
          placeholder={disabled ? "Upload a document first" : "Ask anything about your document…"}
          style={{
            flex: 1,
            borderRadius: 10,
            padding: "0.65rem 0.9rem",
            fontSize: "0.83rem",
            outline: "none",
            fontFamily: "var(--font-body)",
            background: "var(--surface)",
            color: "var(--fg)",
            border: "1.5px solid var(--border)",
            opacity: disabled ? 0.45 : 1,
            cursor: disabled ? "not-allowed" : "text",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => {
            if (!disabled) e.currentTarget.style.borderColor = "var(--accent-rim)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        />
        <button
          disabled={disabled || !value.trim()}
          onClick={() => onSend()}
          className="send-btn"
          style={{
            borderRadius: 10,
            padding: "0.65rem 1.1rem",
            fontSize: "0.8rem",
            fontWeight: 500,
            fontFamily: "var(--font-body)",
            cursor: disabled || !value.trim() ? "not-allowed" : "pointer",
            background: disabled || !value.trim() ? "var(--border-light)" : "var(--accent-pale)",
            color: disabled || !value.trim() ? "var(--fg-muted)" : "var(--accent)",
            border: "1.5px solid",
            borderColor: disabled || !value.trim() ? "var(--border)" : "var(--accent-rim)",
            opacity: disabled ? 0.45 : 1,
            letterSpacing: "0.01em",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
