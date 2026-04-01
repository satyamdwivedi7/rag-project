"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  if (!mounted) return <div style={{ width: 32, height: 18 }} />;

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.35rem",
        background: "var(--toggle-bg)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: "0.2rem 0.55rem",
        cursor: "pointer",
        color: "var(--toggle-fg)",
        fontSize: "0.65rem",
        fontFamily: "var(--font-body)",
        letterSpacing: "0.05em",
        transition: "background 0.2s, border-color 0.2s",
      }}
    >
      <span style={{ fontSize: "0.75rem", lineHeight: 1 }}>
        {theme === "light" ? "○" : "●"}
      </span>
      {theme === "light" ? "Light" : "Dark"}
    </button>
  );
}
