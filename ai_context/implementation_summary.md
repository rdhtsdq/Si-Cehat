# Si Cehat: Architecture & Implementation Summary

## 1. Overview
The Si Cehat project has transitioned from a client-only `localStorage` prototype to an integrated web application powered by **Next.js 15 (App Router)**, **PostgreSQL 18**, **Prisma 6**, **NextAuth v5 (Auth.js)**, and a **Multi-Provider AI Orchestrator with Child Safety Guardrails**.

---

## 2. Infrastructure & Database Setup
- **RDBMS**: PostgreSQL Server 18 running on `localhost:5432`.
- **Database**: `si_cehat`.
- **ORM**: Prisma 6 (`prisma@6.19.3` & `@prisma/client@6.19.3`).
- **Initial Migration**: `20260924125658_init` applied cleanly.
- **Data Models**:
  - `Guardian`: Parent/guardian account with unique email and bcrypt-hashed credentials.
  - `Child`: Child profile belonging to a guardian, storing name and JSON avatar preferences.
  - `DailyProgress`: Daily record of water intake (glasses), physical activity (minutes), XP earned, and active streak.
  - `FoodLog`: Individual meal/snack entries linked to a child and tagged with dietary tones (`balanced`, `sweet`, `fried`, `unknown`).
  - `ChatSession` & `ChatMessage`: Conversational history persisted for child-companion sessions.
  - `BotConfig`: Singleton model storing dynamic AI parameters (provider, model, keys, system prompt).

---

## 3. Authentication, RBAC & Role Isolation
- **Roles Defined**:
  - `ADMIN`: Has exclusive access to the Admin Portal ([`/admin`](file:///c:/laragon/www/Si-Cehat/src/app/admin/page.tsx)), CMS management, aggregate research analytics, and de-identified dataset exports.
  - `GUARDIAN`: Restricted strictly to their own children's daily progress and food journals ([`/parent`](file:///c:/laragon/www/Si-Cehat/src/app/parent/page.tsx)). Cannot view other families or access `/admin`.
- **Security & Route Protection**:
  - Server-side route gatekeeper on [`src/app/admin/page.tsx`](file:///c:/laragon/www/Si-Cehat/src/app/admin/page.tsx) automatically blocks unauthenticated visitors and redirects non-admin accounts to `/admin/login?error=forbidden`.
  - All admin endpoints (`/api/admin/metrics`, `/api/admin/content`, `/api/admin/export`) enforce strict `session.user.role === "ADMIN"` verification.
  - Progress API (`/api/progress`) enforces strict parent ownership (`child.guardianId === session.user.id`), preventing cross-family data snooping.
- **Login Pages**:
  - **Administrator Login**: [`/admin/login`](file:///c:/laragon/www/Si-Cehat/src/app/admin/login/page.tsx)
  - **Parent / Guardian Login**: [`/parent/login`](file:///c:/laragon/www/Si-Cehat/src/app/parent/login/page.tsx)

---

## 4. API Endpoints
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/register` | POST | Registers new guardian and creates default child profile |
| `/api/children` | GET, POST | Lists and creates children profiles for authenticated guardians |
| `/api/progress` | GET, POST | Synchronizes daily water, activity, XP, streak, and meal logs |
| `/api/avatar` | GET, POST | Retrieves and saves avatar preferences |
| `/api/chat` | POST | Child companion chat endpoint routed through safety orchestrator |

---

## 5. Admin Portal, Research Data Exporter & Educational CMS (`/admin`)
- **Admin Metrics API** (`/api/admin/metrics`):
  - Aggregates participant counts, total water intake, exercise minutes, AI companion messages, and dietary tone distribution (balanced vs sweet vs fried).
- **Anonymized Research Exporter** (`/api/admin/export`):
  - Generates de-identified research datasets in CSV or JSON format.
  - Strips PII and replaces child IDs with deterministic participant codes (e.g., `P-001-A7B2`).
  - Formatted for direct analysis in statistics software (SPSS, R, Pandas, Excel).
- **Educational Content CMS** (`/api/admin/content` & `/api/content`):
  - Manages `Challenge`, `Quiz`, and `RecommendedMenu` database models.
  - Admins can activate/deactivate specific challenges and quizzes, create new health missions, add knowledge questions, and adjust recommended family dinner menus.
  - Changes instantly propagate to the Child mode map ([`/child`](file:///c:/laragon/www/Si-Cehat/src/app/child/page.tsx)) and Parent summary ([`/parent`](file:///c:/laragon/www/Si-Cehat/src/app/parent/page.tsx)).
- **Bot & AI Configuration CMS** (`/api/admin/bot-config`):
  - Allows runtime modification of the AI provider, model, API keys, and context (system prompt).
  - Includes a live Sandbox test endpoint (`/api/admin/bot-config/test`) to verify model connectivity and tone before deployment.
- **Admin Dashboard UI** (`src/app/admin/page.tsx`):
  - Designed in identical warm editorial Si Cehat style (`#f2f0e7`, `#18372e`, `#e2e7d2`, `display-font`).
  - Dual tabs: "Analitik Riset" and "Kelola Konten (CMS)".

---

## 6. AI Orchestrator & Safety Guardrails (`src/lib/ai-orchestrator.ts`)
- **Multi-Provider Architecture**:
  - Dynamically configured via the database `BotConfig` singleton, falling back to `.env` variables (`AI_BASE_URL`, `AI_API_KEY`, and `AI_MODEL`) if no DB override is present.
  - Built-in fallback mock provider for local offline operation without API downtime.
- **Child Safety Guardrails**:
  - **Pre-filtering**: Detects requests for medical prescriptions, dosages, severe disease diagnostics, and self-harm keywords, instantly redirecting the child to adult/doctor supervision.
  - **Post-filtering**: Validates model output to ensure no diagnostic or prescription statements leak through.
  - **Tone Enforcement**: Positive, encouraging, non-judgmental Bahasa Indonesia suitable for children ages 8–12.

---

## 7. Hybrid & Offline-Resilient Frontend
- `src/lib/progress.ts` and `src/lib/avatar.ts` retain instant client-side responsiveness using `localStorage` while asynchronously synchronizing state with `/api/progress` and `/api/avatar` in the background.
- Both the Child interface (`/child`, `/chat`, `/avatar`) and Parent Dashboard (`/parent`) operate smoothly whether in guest mode or logged in with a guardian account.

---

## 8. Verification Status
- **TypeScript**: `bun run typecheck` passed (0 errors).
- **ESLint**: `bun run lint` passed (0 errors/warnings).
- **Production Build**: `bun run build` generated 17/17 routes successfully.

---

## 9. Next Session Handoff & Gap Analysis
As of the current milestone, the CMS covers Metrics, Educational Content, AI Configuration, and Research Export. However, based on `PRD.md` and `prisma/schema.prisma`, the following areas are **not yet covered** by the CMS and represent the next logical steps for the MVP:
1. **User Management**: No admin views exist to list all `Guardian` or `Child` accounts, meaning admins cannot view individual profiles, reset passwords, change roles, or delete users.
2. **Individual Activity Audit**: The CMS only shows aggregate metrics and a generic "Recent 10 Activities" table. There is no dedicated view to drill down into a specific child's complete `FoodLog`, `DailyProgress`, or Challenge/Quiz history.
3. **Chat Log Review (Safety Audit)**: While total messages are counted, admins cannot read the actual `ChatSession` and `ChatMessage` transcripts. This is a critical gap for a research app, as researchers need to evaluate how safely the AI is responding to children.

**Decision for next session:** The user should decide whether to build out one of these missing features (e.g., a Chat Log Review page for safety audits) or if the current MVP scope is sufficient.

