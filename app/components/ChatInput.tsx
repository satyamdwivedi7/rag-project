"use client";

type Props = {
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
  onSend: (directQuestion?: string) => void;
  compareMode?: boolean;
  onToggleCompare?: () => void;
  selectedCount?: number;
};

export default function ChatInput({
  value,
  disabled,
  onChange,
  onSend,
  compareMode = false,
  onToggleCompare,
  selectedCount = 0,
}: Props) {
  const canCompare = selectedCount >= 2;

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
        {onToggleCompare && (
          <button
            disabled={!canCompare}
            onClick={onToggleCompare}
            title={
              canCompare
                ? compareMode
                  ? "Switch to single-doc mode"
                  : "Switch to compare mode"
                : "Select 2+ documents to compare"
            }
            style={{
              borderRadius: 10,
              padding: "0.65rem 0.8rem",
              fontSize: "0.75rem",
              fontWeight: 500,
              fontFamily: "var(--font-body)",
              cursor: canCompare ? "pointer" : "not-allowed",
              background:
                compareMode && canCompare ? "var(--accent-pale)" : "var(--border-light)",
              color:
                compareMode && canCompare ? "var(--accent)" : "var(--fg-muted)",
              border: "1.5px solid",
              borderColor:
                compareMode && canCompare ? "var(--accent-rim)" : "var(--border)",
              opacity: canCompare ? 1 : 0.45,
              letterSpacing: "0.01em",
              flexShrink: 0,
            }}
          >
            Compare
          </button>
        )}
        <input
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) onSend();
          }}
          placeholder={
            disabled
              ? compareMode
                ? "Select 2+ documents to compare"
                : "Upload a document first"
              : compareMode
              ? "Ask a question across selected documents…"
              : "Ask anything about your document…"
          }
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
            background:
              disabled || !value.trim() ? "var(--border-light)" : "var(--accent-pale)",
            color:
              disabled || !value.trim() ? "var(--fg-muted)" : "var(--accent)",
            border: "1.5px solid",
            borderColor:
              disabled || !value.trim() ? "var(--border)" : "var(--accent-rim)",
            opacity: disabled ? 0.45 : 1,
            letterSpacing: "0.01em",
          }}
        >
          {compareMode ? "Compare" : "Send"}
        </button>
      </div>
    </div>
  );
}
