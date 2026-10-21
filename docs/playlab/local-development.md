# Local Development Guide — Si-Cehat PlayLab Web Game

## 1. Prerequisites
- **Runtime:** [Bun](https://bun.sh) (v1.1+ recommended) or Node.js (v18+).
- **Package Manager:** Bun (`bun install`, `bun run`).
- **Backend Host:** Si-Cehat Hono backend running on `http://localhost:3000`.

## 2. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env.local
```

Default contents:
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_GAME_SLUG=piring-sehat-nimbo
VITE_PROTOCOL_VERSION=1
```

## 3. Running Locally
Install dependencies:
```bash
bun install
```

Start the Vite development server:
```bash
bun run dev
```
The game will be available at `http://localhost:5173`.

## 4. Running Verification Gates
* **Lint / Typecheck:**
  ```bash
  bun run lint
  ```
* **Run Unit Tests:**
  ```bash
  bun test
  ```
* **Production Build:**
  ```bash
  bun run build
  ```
* **Preview Production Build:**
  ```bash
  bun run preview
  ```

## 5. Simulating Flutter WebView Integration
To simulate the bridge without a native device:
1. Open developer tools in your browser.
2. The game automatically falls back to `window.parent.postMessage` or logs messages to console:
   - `GAME_READY`
   - `GAME_COMPLETED`
   - `EXIT_GAME`
3. Test URL parameters:
   - `http://localhost:5173/?sessionId=test-123&childId=child-abc`
   - `http://localhost:5173/?bootstrap=ephemeral-token`
