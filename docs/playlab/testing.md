# Automated & Manual Test Strategy — Si-Cehat PlayLab

## 1. Automated Test Suites

### 1.1 Web Game Unit Tests (`si-cehat-game-web`)
* **Test Runner:** Bun Test (`bun test`).
* **Test Files:**
  * `tests/scoring.test.ts`: Verifies deterministic 4-quadrant scoring, distractor penalties, star thresholds, and decoupled knowledge calculations.
  * `tests/bridge.test.ts`: Verifies serialization and format of `GAME_READY`, `GAME_COMPLETED`, and `EXIT_GAME`.
  * `tests/content-schema.test.ts`: Validates `v1.json` against required category presence, valid tips, and single correct answer keys.
* **Results:** **11 pass / 0 fail** (8ms).

### 1.2 Backend Unit & Integration Tests (`Si-Cehat`)
* **Test Runner:** Bun Test (`bun test src/server/__tests__/game-scoring.test.ts`).
* **Test Files:**
  * `src/server/__tests__/game-scoring.test.ts`: Validates `FOOD_ITEMS_MAP` category mappings and `KNOWLEDGE_KEY` answers.
* **Typecheck:** `bun run typecheck` (`bunx tsc --noEmit`) passes with 0 errors.
* **Results:** **2 pass / 0 fail** (362ms).

### 1.3 Flutter Mobile Host Integration Tests (`Si-Cehat-mobile`)
* **Test Runner:** Flutter Test (`flutter test`).
* **Test Files:**
  * `test/playlab_bridge_test.dart`: Validates JSON bridge protocol decoding and safe rejection of malformed messages.
  * `test/si_cehat_full_test.dart`: Validates home dashboard rendering, risk meter, and navigation.
* **Results:** **All tests pass cleanly**.

---

## 2. Manual Test Matrix

| Test ID | Scenario | Expected Behavior | Outcome |
|---|---|---|---|
| **MAN-01** | Open PlayLab from Flutter Home | Native spinner shows, requests session with bootstrap token, WebView loads without white flash. | Pass |
| **MAN-02** | Drag card to plate quadrant | Card highlights matching quadrant, drops in place, and displays checkmark. | Pass |
| **MAN-03** | Tap card (accessibility fallback) | Tapping card automatically places it in its matching quadrant. | Pass |
| **MAN-04** | Select distractor item (Donat) | Nimbo mascot coaches child with neutral advice; item is not placed in healthy quadrant. | Pass |
| **MAN-05** | Complete 3 rounds | Button advances to Knowledge Quiz screen. | Pass |
| **MAN-06** | Complete Knowledge Quiz | Submits answers to `/api/game-sessions/:id/complete`; Result modal celebrates with stars and XP. | Pass |
| **MAN-07** | Exit game | Fires `EXIT_GAME` message; Flutter dismisses screen and refreshes child profile. | Pass |
| **MAN-08** | Unauthorized URL attempt | WebView blocks navigation outside allowed game host origin. | Pass |
