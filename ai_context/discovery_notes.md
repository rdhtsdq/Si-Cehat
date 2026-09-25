# Si Cehat - Discovery & Context Notes

## 1. Product Requirements (PRD.md Summary)
- **Target:** Children 8-12 / grades 3-6.
- **Core Loop:** Talk -> Learn -> Do -> Track -> Reward -> Repeat.
- **Child Mode:** Chat with AI (Avatar: Default, Apple, Broccoli, Carrot), Daily Challenges, Quizzes, Food/Water/Activity logging, XP/Rewards.
- **Parent Mode:** Dashboard with summaries, menu/recipe recommendations, non-judgmental tracking.
- **AI Constraints:** Educational companion, NOT medical. Cannot diagnose or prescribe. Must use short sentences (2-5 lines for kids).
- **Architecture Hints (MVP):** Next.js App Router, Tailwind v4, Framer Motion, local storage initially, AI via server endpoints (`/api/chat`). No DB required for the immediate MVP, but required for the target platform.

## 2. Directory Structure Findings
- **src/app/**: Contains Next.js App Router pages.
  - `/api`: Backend routes.
  - `/avatar`: Avatar customization.
  - `/chat`: AI interaction chat interface.
  - `/child`: Child dashboard.
  - `/parent`: Parent dashboard.
- **src/components/**: (To be explored)
- **src/lib/**: (To be explored)

## 3. Existing Models / Data Structures (Local Storage & Zod schemas)
- **AvatarPreference (`avatarStorageKey`)**: Stores `character` (default, apple, broccoli, carrot), `accessory`, and `orbColor`.
- **DailyProgress (`progressStorageKey`)**: Tracks `date`, `childName`, `waterGlasses`, `activityMinutes`, `foodLogs` (array of { name, tone }), `challengeCompleted`, `quizCompleted`, `xp`, and `streak`.
- **Chat State**: Controlled by `chatMessageSchema` (`role`, `content`). The system prompt establishes the "Si Cehat" persona, instructing it to answer in simple Indonesian for 8-12 year olds, max 5 short sentences, no medical diagnosis, no extreme diet advice.

## Next Steps for Target Architecture
Based on these findings and the PRD, the target architecture needs:
1. **Child Web App / Parent Web App / Admin Web App** - potentially separated or as route groups.
2. **Backend & DB** - migrating away from `localStorage` to PostgreSQL (separating User Data, Behavioral Data, AI Data, Reference Data).
3. **AI Architecture** - an orchestrator that handles safety validation and tool calling (e.g. `log_food`, `log_water`) securely server-side.
4. **Admin Portal** - for system monitoring, AI model/prompt management, and anonymized research data exports.
