"use client";

type Props = {
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
  onSend: (directQuestion?: string) => void;
  compareMode?: boolean;
  onToggleCompare?: () => void;
  selectedCount?: number;
  isDesktop: boolean;
};

export default function ChatInput({
  value,
  disabled,
  onChange,
  onSend,
  compareMode = false,
  onToggleCompare,
  selectedCount = 0,
  isDesktop,
}: Props) {
  const canCompare = selectedCount >= 2;
  const showCompareBanner = canCompare && onToggleCompare;

  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: "1px solid var(--border-light)",
        background: "var(--bg)",
      }}
    >
      {/* Compare mode discovery banner */}
      {showCompareBanner && (
        <div
          style={{
            padding: isDesktop ? "0.55rem 1.25rem" : "0.45rem 0.8rem",
            borderBottom: "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: compareMode ? "var(--accent-pale)" : "var(--surface)",
            gap: "0.6rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke={compareMode ? "var(--accent)" : "var(--fg-muted)"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="18" rx="1" />
              <rect x="14" y="3" width="7" height="18" rx="1" />
            </svg>
            <span
              style={{
                fontSize: "0.68rem",
                fontFamily: "var(--font-body)",
                color: compareMode ? "var(--accent)" : "var(--fg-muted)",
                letterSpacing: "0.01em",
                overflowWrap: "anywhere",
              }}
            >
              {compareMode
                ? `Compare mode — asking across ${selectedCount} documents`
                : `${selectedCount} documents selected — enable Compare mode to cross-analyze them`}
            </span>
          </div>
          <button
            onClick={onToggleCompare}
            style={{
              fontSize: "0.65rem",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              cursor: "pointer",
              padding: "0.2rem 0.6rem",
              borderRadius: 6,
              border: "1px solid",
              borderColor: compareMode ? "var(--accent-rim)" : "var(--border)",
              background: compareMode ? "var(--accent)" : "transparent",
              color: compareMode ? "#fff" : "var(--fg-secondary)",
              letterSpacing: "0.03em",
              transition: "all 0.15s",
              flexShrink: 0,
            }}
          >
            {compareMode ? "On" : "Off"}
          </button>
        </div>
      )}

      {/* Input row */}
      <div
        style={{
          padding: isDesktop ? "0.75rem 1.25rem 1.25rem" : "0.65rem 0.8rem 0.8rem",
          display: "flex",
          gap: 8,
          alignItems: "stretch",
        }}
      >
        <input
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) onSend();
          }}
          placeholder={
            disabled
              ? "Upload a document first"
              : compareMode
              ? "Ask a question across all selected documents…"
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
            minWidth: 0,
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
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {compareMode ? "Compare" : "Send"}
        </button>
      </div>
    </div>
  );
}
