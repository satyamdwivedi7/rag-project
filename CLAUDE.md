# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DocMind** — upload a PDF, get citation-grounded answers powered by Gemini 2.5 Flash. Built with Next.js 16 App Router, deployed on Vercel.

## Commands

```bash
npm run dev      # dev server on http://localhost:3000
npm run build
npm run lint
npx tsc --noEmit
```

Requires `GEMINI_API_KEY` in `.env.local`.

## Architecture

Single Next.js app. No separate backend. All AI logic runs as Vercel serverless functions.

> ⚠️ **Next.js 16 has breaking changes** from earlier versions. Before editing, read the relevant guide in `node_modules/next/dist/docs/`.

**API Routes (`app/api/`):**
- `POST /api/upload` — receives PDF via FormData, writes to `/tmp`, uploads to Gemini Files API, then runs a second Gemini call to extract a `DocumentBrief` (summary, topics, suggested questions). Returns `{ fileUri, message, brief }`.
- `POST /api/ask` — takes `{ question, fileUri }`, calls Gemini with `responseSchema` to return `{ answer, citations[] }`. Citations are verbatim excerpts from the document that support the answer.

Both routes use `responseMimeType: "application/json"` + `responseSchema` (`SchemaType` from `@google/generative-ai`) for structured output. Errors surface the actual message rather than swallowing it.

**Shared types (`app/types.ts`):** `Citation`, `DocumentBrief`, `Message` — imported by both API routes and components.

**Components (`app/components/`):**
- `LeftPanel` — static feature list before upload; switches to live `DocumentBrief` (summary, topic chips, clickable suggested questions) after upload
- `ChatMessages` — renders markdown AI responses with `ReactMarkdown`; collapsible "Sources ↓" citation cards below each AI message
- `ChatInput`, `UploadZone`, `ThemeToggle` — input bar, file upload zone, dark/light mode toggle

**Styling:** Tailwind CSS v4 (`@import "tailwindcss"` in `app/globals.css`). All colors via CSS custom properties with `[data-theme="dark"]` overrides including `--tw-prose-*` for typography. Theme persisted in `localStorage`, applied before hydration via inline script in `app/layout.tsx`.
