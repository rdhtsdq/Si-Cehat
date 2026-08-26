# Graph Report - research  (2026-08-26)

## Corpus Check
- 22 files · ~11,966 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 234 nodes · 287 edges · 23 communities (15 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- avatar.ts
- Runtime Dependencies
- compilerOptions
- Avatar System
- Developer Tooling Dependencies
- Package Scripts Config
- AI Safety Requirements
- Chat API Implementation
- Server AI Architecture
- child/page.tsx
- OpenCode Graphify Config
- Si Cehat
- ESLint Flat Config
- PRD Research Context
- Agent Workflow Commands
- Graphify Plugin File
- App Root Layout
- Next Config
- PostCSS Config
- Completion Criteria
- MVP Scope Limits
- Research Evaluation
- Next Env Types

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `Si Cehat` - 13 edges
3. `ChildDashboardPage()` - 11 edges
4. `updateProgress()` - 7 edges
5. `loadAvatarPreference()` - 7 edges
6. `createDefaultProgress()` - 7 edges
7. `loadProgress()` - 7 edges
8. `Avatar System` - 7 edges
9. `scripts` - 6 edges
10. `Chat Interface` - 6 edges

## Surprising Connections (you probably didn't know these)
- `MVP Behavior and Safety Boundaries` --semantically_similar_to--> `Medical Boundary`  [INFERRED] [semantically similar]
  AGENTS.md → PRD.md
- `/api/chat Server Endpoint` --semantically_similar_to--> `POST /api/chat`  [INFERRED] [semantically similar]
  AGENTS.md → PRD.md
- `Server-only AI Environment Variables` --semantically_similar_to--> `Security Requirement`  [INFERRED] [semantically similar]
  AGENTS.md → PRD.md
- `ChildDashboardPage()` --calls--> `loadAvatarPreference()`  [EXTRACTED]
  src/app/child/page.tsx → src/lib/avatar.ts
- `AvatarPage()` --calls--> `loadAvatarPreference()`  [EXTRACTED]
  src/app/avatar/page.tsx → src/lib/avatar.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Avatar Character Set** — prd_default_orb, prd_apel, prd_brokoli, prd_wortel [EXTRACTED 1.00]
- **Avatar Interaction States** — prd_idle_state, prd_listening_state, prd_thinking_state, prd_talking_state [EXTRACTED 1.00]
- **LLM Safety Architecture** — prd_system_prompt, prd_ai_scope, prd_medical_boundary, prd_api_chat, prd_security_requirement [EXTRACTED 1.00]

## Communities (23 total, 8 thin omitted)

### Community 0 - "avatar.ts"
Cohesion: 0.14
Nodes (21): AvatarPage(), updatePreference(), orbColors, ChatPage(), handleSubmit(), submitQuestion(), AvatarRenderer(), AvatarRendererProps (+13 more)

### Community 1 - "Runtime Dependencies"
Cohesion: 0.10
Nodes (21): framer-motion, motion, motion-dom, motion-utils, next, dependencies, framer-motion, motion (+13 more)

### Community 2 - "compilerOptions"
Cohesion: 0.07
Nodes (26): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+18 more)

### Community 3 - "Avatar System"
Cohesion: 0.11
Nodes (22): Apel Avatar, AppState, Avatar Customization, Avatar State Machine, Avatar System, Brokoli Avatar, Chat Interface, Child Friendly Design (+14 more)

### Community 4 - "Developer Tooling Dependencies"
Cohesion: 0.13
Nodes (15): eslint, eslint-config-next, @eslint/eslintrc, devDependencies, eslint, eslint-config-next, @eslint/eslintrc, @types/node (+7 more)

### Community 5 - "Package Scripts Config"
Cohesion: 0.15
Nodes (12): name, overrides, motion-dom, motion-utils, private, scripts, build, dev (+4 more)

### Community 6 - "AI Safety Requirements"
Cohesion: 0.28
Nodes (9): Graphify Workflow, MVP Behavior and Safety Boundaries, PRD.md, AI Requirements, AI Scope, Controlled AI, Functional Requirements, Medical Boundary (+1 more)

### Community 7 - "Chat API Implementation"
Cohesion: 0.27
Nodes (8): envSchema, jsonError(), POST(), providerResponseSchema, ChatMessage, chatMessageSchema, chatRequestSchema, systemPrompt

### Community 8 - "Server AI Architecture"
Cohesion: 0.29
Nodes (8): /api/chat Server Endpoint, Server-only AI Environment Variables, AI Service, POST /api/chat, LLM Architecture, OpenAI-compatible API, Proposed Technology, Security Requirement

### Community 9 - "child/page.tsx"
Cohesion: 0.15
Nodes (25): ChildDashboardPage(), addActivity(), addWater(), answerQuiz(), completeChallenge(), submitFood(), updateProgress(), foodToneLabels (+17 more)

### Community 10 - "OpenCode Graphify Config"
Cohesion: 0.29
Nodes (6): plugin, $schema, .opencode/plugins/graphify.js, opencode-snip@latest, openslimedit@latest, @tarquinen/opencode-dcp@latest

### Community 11 - "Si Cehat"
Cohesion: 0.12
Nodes (15): Arsitektur, Batas Keselamatan, Commands, Data Lokal, Halaman, Instalasi, Konfigurasi AI, Kontribusi (+7 more)

### Community 12 - "ESLint Flat Config"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

### Community 13 - "PRD Research Context"
Cohesion: 0.50
Nodes (4): ADDIE Methodology, AI Avatar Edukasi, Analyze Focus Group Discussion Requirements, Si Cehat

### Community 14 - "Agent Workflow Commands"
Cohesion: 0.67
Nodes (3): Bun Package Management, Next.js App Router Prototype, Lint Typecheck Build Verification Gates

## Knowledge Gaps
- **108 isolated node(s):** `$schema`, `.opencode/plugins/graphify.js`, `openslimedit@latest`, `@tarquinen/opencode-dcp@latest`, `opencode-snip@latest` (+103 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Runtime Dependencies` to `Package Scripts Config`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Developer Tooling Dependencies` to `Package Scripts Config`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `loadAvatarPreference()` connect `avatar.ts` to `child/page.tsx`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `$schema`, `.opencode/plugins/graphify.js`, `openslimedit@latest` to the rest of the system?**
  _108 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `avatar.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1396011396011396 - nodes in this community are weakly interconnected._
- **Should `Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._