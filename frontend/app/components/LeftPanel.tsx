const features = [
  {
    label: "01",
    title: "Semantic chunking",
    body: "Your PDF is split into overlapping passages and stored as vector embeddings — not keyword indexes.",
  },
  {
    label: "02",
    title: "Grounded answers",
    body: "Responses are constrained to what is in your document. Nothing is invented.",
  },
  {
    label: "03",
    title: "Structured output",
    body: "Gemini 2.5 Flash formats every answer in Markdown — headings, bullets, and bold exactly where they help.",
  },
];

export default function LeftPanel() {
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
            Doc
            <span style={{ color: "var(--accent)" }}>Mind</span>
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
            Upload any PDF. Ask anything. Get answers drawn directly from your
            document — not the internet.
          </p>
        </div>

        <div
          className="fade-up delay-1"
          style={{
            height: 1,
            background: "var(--border)",
            marginBottom: "2rem",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {features.map((f, i) => (
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
          ChromaDB · Gemini 2.5 Flash · FastAPI
        </div>
      </div>
    </aside>
  );
}
