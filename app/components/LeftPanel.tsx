import type { DocumentBrief } from "../types";

const staticFeatures = [
  {
    label: "01",
    title: "Document-native reasoning",
    body: "Your PDF is sent directly to Gemini's context window — no chunking, no retrieval step, no lost nuance.",
  },
  {
    label: "02",
    title: "Citation-grounded answers",
    body: "Every response is paired with verbatim excerpts from your document so you can verify the source.",
  },
  {
    label: "03",
    title: "Structured output",
    body: "Answers are schema-constrained JSON — not free-form text. Hallucination is an engineering problem, not just a prompt one.",
  },
];

type Props = {
  brief: DocumentBrief | null;
  onAskQuestion: (q: string) => void;
};

export default function LeftPanel({ brief, onAskQuestion }: Props) {
  return (
    <aside
      style={{
        width: "38%",
        minWidth: 300,
        maxWidth: 460,
        flexShrink: 0,
        background: "var(--bg-left)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "3rem 2.5rem",
        overflow: "hidden",
      }}
    >
      <div>
        <div className="fade-up" style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              fontSize: "0.62rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--accent)",
              fontFamily: "var(--font-body)",
              marginBottom: "0.6rem",
              fontWeight: 500,
            }}
          >
            Document Intelligence
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "clamp(2.4rem, 4vw, 3.2rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "var(--fg)",
            }}
          >
            Doc<span style={{ color: "var(--accent)" }}>Mind</span>
          </h1>
          <p
            style={{
              marginTop: "0.9rem",
              fontSize: "0.85rem",
              lineHeight: 1.7,
              color: "var(--fg-secondary)",
              fontFamily: "var(--font-body)",
              maxWidth: 300,
            }}
          >
            Upload any PDF. Ask anything. Get answers drawn directly from your document — not the internet.
          </p>
        </div>

        <div
          className="fade-up delay-1"
          style={{ height: 1, background: "var(--border)", marginBottom: "2rem" }}
        />

        {brief ? (
          <div className="fade-up delay-2" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <p
              style={{
                fontSize: "0.78rem",
                lineHeight: 1.7,
                color: "var(--fg-secondary)",
                fontFamily: "var(--font-body)",
              }}
            >
              {brief.summary}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {brief.topics.map((topic) => (
                <span
                  key={topic}
                  style={{
                    fontSize: "0.65rem",
                    fontFamily: "var(--font-body)",
                    color: "var(--accent)",
                    background: "var(--accent-pale)",
                    border: "1px solid var(--accent-rim)",
                    borderRadius: 20,
                    padding: "0.15rem 0.55rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  {topic}
                </span>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
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
                Suggested questions
              </div>
              {brief.questions.map((q) => (
                <button
                  key={q}
                  onClick={() => onAskQuestion(q)}
                  style={{
                    textAlign: "left",
                    fontSize: "0.75rem",
                    color: "var(--fg-secondary)",
                    fontFamily: "var(--font-body)",
                    lineHeight: 1.5,
                    cursor: "pointer",
                    padding: "0.35rem 0.5rem",
                    borderRadius: 6,
                    border: "1px solid transparent",
                    background: "transparent",
                    transition: "background 0.15s, border-color 0.15s",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--accent-pale)";
                    e.currentTarget.style.borderColor = "var(--accent-rim)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {staticFeatures.map((f, i) => (
              <div
                key={f.label}
                className={`fade-up delay-${i + 2}`}
                style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "var(--accent)",
                    marginTop: "0.15rem",
                    flexShrink: 0,
                    letterSpacing: "0.04em",
                  }}
                >
                  {f.label}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "var(--fg)",
                      marginBottom: "0.25rem",
                      fontFamily: "var(--font-body)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {f.title}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      lineHeight: 1.65,
                      color: "var(--fg-muted)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {f.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: "2.5rem" }}>
        <div style={{ height: 1, background: "var(--border-light)", marginBottom: "1rem" }} />
        <div
          style={{
            fontSize: "0.62rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--fg-muted)",
            fontFamily: "var(--font-body)",
          }}
        >
          Gemini 2.5 Flash · Next.js · Vercel
        </div>
      </div>
    </aside>
  );
}
