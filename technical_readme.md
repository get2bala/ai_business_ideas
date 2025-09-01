# Technical README — ai_business_ideas

Purpose
- Brief, actionable technical overview to help developers understand, run, and debug the project.

Project layout (important files)
- `index.html` — app entry; loads CDNs, `config.js`, and client modules. Injects `components/home.html` at runtime.
- `components/home.html` — home/marketing partial injected into `index.html`.
- `config.js` — runtime configuration (SUPABASE_URL, SUPABASE_ANON_KEY, GENERATE_FN_URL, SYSTEM_PROMPT).
- `db.js` — exports `db` (Supabase client) or a test stub when unavailable.
- `auth.js` — manages authentication UI and `initAuth(onAuthStateChange)` / `getCurrentUser()`.
- `api.js` — CRUD API wrappers for ideas and favorites using `db`.
- `ui.js` — DOM rendering, modal logic, markdown rendering (prefers `markdown-it`, includes a small fallback).
- `app.js` — bootstraps the app: initializes auth, loads ideas, wires UI handlers.
- `auto_idea_api.js` — client-side wrapper that calls the Edge Function (adds Authorization header, handles 401, falls back to local generator).
- `auto_idea_generator.js` — local fallback generator (dev/tests).
- `functions/generate-idea.ts` — Supabase Edge Function (Deno): validates token, calls AI provider, returns structured idea JSON.
- `__tests__/*` and `jest.*` — Jest tests.

High-level runtime flows

1) Page load
- `index.html` loads CDNs and `config.js`. Scripts (`app.js`, `api.js`, `auth.js`, `ui.js`) run. `components/home.html` is fetched and injected into `#home-content`.

2) Auth
- `auth.initAuth` hooks `db.auth.onAuthStateChange` and updates UI. `db` is the Supabase client (created in `db.js`) and exposes `db.auth.getSession()` for tokens.

3) Idea Generation (AI)
- User triggers `generateAutoIdea` (UI event) → `ui.js` opens modal and calls `auto_idea_api.fetchAutoIdea(prompt)`.
- `fetchAutoIdea` obtains the session token via `db.auth.getSession()`. If no token, it prompts login and throws `Authentication required` (client-side short-circuit).
- With token: fetch POST to `GENERATE_FN_URL` with headers `Authorization: Bearer <token>` and body `{ promptText, systemPrompt }`.
- Edge function (`functions/generate-idea.ts`) validates the token by calling Supabase `/auth/v1/user` with the token + service role key, calls AI provider (Gemini in repo) and returns `{ idea }`.
- Client renders returned `idea` in modal; otherwise falls back to `auto_idea_generator.js`.

Configuration & dependencies
- Runtime (browser):
  - TailwindCSS (CDN)
  - Supabase JS SDK (CDN)
  - markdown-it (CDN) — used by `ui.js` when available
- Dev/test:
  - Jest, babel-jest, jest-environment-jsdom (see `package.json`) for tests
- Edge function (Deno): needs env vars: `SUPABASE_URL`, `SERVICE_ROLE_KEY`, `GEMINI_API_KEY` (optional `SYSTEM_PROMPT`)

Contract: client ⇄ generate-edge-function
- Request (client -> function):
  - Method: POST
  - Headers: `Content-Type: application/json`, `Authorization: Bearer <access_token>` (required)
  - Body: { promptText: string, systemPrompt?: string }
- Success response (200): { idea: { title, summary, details, tags[], icon? } }
- Errors:
  - 401 Unauthorized — missing/invalid token
  - 400 Bad Request — missing promptText
  - 5xx — AI provider or server error

Data shapes
- idea (client / DB): { id?, title, summary, details (markdown), tags: string[], icon?, user_id? }
- session: { access_token, user }

Common failure modes & debugging checklist

1) Generate returns 401 or "Authentication required"
- Check Network tab: ensure `Authorization` header is present on POST. If missing, `db.auth.getSession()` isn't returning a session.
- If preflight (OPTIONS) fails, ensure the Edge Function replies to OPTIONS with:
  - Access-Control-Allow-Origin: <origin> or *
  - Access-Control-Allow-Methods: POST, OPTIONS
  - Access-Control-Allow-Headers: Authorization, Content-Type

2) Home partial doesn't load / 404
- Serving over `file://` blocks fetch; run a simple local server: `npx http-server .` or `python -m http.server`.

3) `Supabase client not found` or config errors
- Confirm `config.js` is loaded and defines `SUPABASE_URL` and `SUPABASE_ANON_KEY` before `db.js` runs.

4) Markdown not rendering nicely
- Confirm `markdown-it` loaded (check `window.markdownit`). If not present, `ui.js` falls back to a simple renderer. For production reliability, bundle `markdown-it` locally.

5) Edge Function errors contacting AI provider
- Check function logs in Supabase dashboard; verify `GEMINI_API_KEY` and network access.

Step-by-step debugging recipe (quick)
1. Open browser DevTools (Console + Network).
2. Reproduce the issue. Inspect failed request/response headers and bodies.
3. Confirm `db.auth.getSession()` returns a session: in console run `db.auth.getSession().then(console.log)`.
4. Verify `GENERATE_FN_URL` in `config.js` is correct and reachable.
5. If 401 from function: inspect function logs (Supabase) for token verification errors.

Local dev & test commands
- Serve site for local testing (so fetch('components/home.html') works):
  ```bash
  npx http-server .
  # or
  python -m http.server 8000
  ```
- Install deps (tests): `npm install`
- Run tests: `npm test`

Recommended improvements (short list)
- Add a retry-after-login mechanism: store pending prompt, and re-call `fetchAutoIdea` automatically after successful login.
- Bundle `markdown-it` in the project or import via npm to avoid relying on CDN at runtime.
- Add a small helper `getAccessToken()` with clear error messages and token refresh logic.
- Harden Edge Function CORS: respond to OPTIONS with appropriate headers including `Authorization` in `Access-Control-Allow-Headers`.

Contact points (files to edit for each task)
- CHANGE markdown behavior: `ui.js` (search `simpleMarkdownFallback` and markdownit usage).
- Change auth flow/auto-retry: `auto_idea_api.js` and `auth.js` (hook into onAuthStateChange to re-run pending actions).
- Change Edge Function CORS or auth logic: `functions/generate-idea.ts`.

Status & verification
- Tests: run `npm test` — project includes Jest tests that validate core behaviors.
- Manual verification: serve static site and test auth + generate flows; inspect network and function logs.

If you want, I can implement one of these next:
- A) Auto-retry generation after login (client-side change)
- B) Add/patch Edge Function CORS headers example
- C) Bundle `markdown-it` via npm and update `ui.js` to import it

---
Generated: September 1, 2025
