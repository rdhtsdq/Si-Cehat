# Agent Instructions

## Current Repo State
- `PRD.md` remains the product source of truth for MVP behavior and safety boundaries.
- This is a Next.js App Router prototype using TypeScript, Tailwind CSS v4, Framer Motion, Zod, and Bun.
- There is no CI or test suite yet; use lint, typecheck, and build as the available verification gates.

## Package Manager
- Use Bun for dependency management and scripts.
- Do not create `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`; the lockfile should be Bun-managed.
- Prefer `bun install`, `bun add`, `bun run <script>`, and `bunx` over npm/pnpm/yarn equivalents.

## Commands
- Install dependencies: `bun install`
- Start dev server: `bun run dev`
- Lint: `bun run lint`
- Typecheck: `bun run typecheck`
- Production build: `bun run build`

## Environment
- Copy `.env.example` to `.env.local` for local AI calls.
- Required server-only vars: `AI_BASE_URL`, `AI_API_KEY`, and `AI_MODEL`.
- Do not prefix AI credentials with `NEXT_PUBLIC_`; they must never enter the client bundle.

## Product Constraints From `PRD.md`
- MVP target stack: Next.js, TypeScript, Tailwind CSS, Framer Motion, Zod, OpenAI-compatible API, and `localStorage`; no database is required.
- Required pages are `/` onboarding, `/avatar` customization, and `/chat` AI interaction.
- LLM calls must go through a server endpoint such as `/api/chat`; never expose `AI_API_KEY` in frontend code.
- Provider config should use `AI_BASE_URL`, `AI_API_KEY`, and `AI_MODEL`.
- Avatar choices are Default Orb, Apel, Brokoli, and Wortel; avatar states are `idle`, `listening`, `thinking`, and `talking`.
- Persist avatar preferences in `localStorage`; keep conversation history session-local for the MVP.
- AI responses must be child-friendly Bahasa Indonesia, brief, health-education focused, and must not diagnose, prescribe medication, or replace medical advice.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
