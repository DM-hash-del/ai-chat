# Frontend plan: assistant-ui on the existing Vite app

Lives at `docs/frontend-plan.md` (project root). Claude Code in the frontend root reads it through `frontend/CLAUDE.md`.

**Must-haves:** registration/login and a smooth chat experience. Everything else is secondary.

**How each phase runs with Claude Code**
1. Start Claude Code in the **frontend root** (backend root for Phase 0). One phase per session.
2. Switch to **plan mode** first. Claude Code proposes the files it will create or change; you read the plan before accepting.
3. Let it build, then **you** run the app and check the acceptance list yourself.
4. Commit when the phase passes. `/clear` (or a new session) before the next phase.
5. If something's wrong, describe what you saw (status code, console error, screenshot), not how to fix it.

---

## Key decisions (add to `decisions.md`)

| Topic | Decision |
|---|---|
| UI library | assistant-ui, installed into the existing Vite app with `npx assistant-ui@latest init` (never `create`) |
| Runtime | **`ExternalStoreRuntime`**: React state holds the messages Laravel returns. Not `LocalRuntime`, no history adapter, no Assistant Cloud, no AI SDK |
| Sidebar | `ExternalStoreThreadListAdapter`: list, switch, new, rename, delete |
| Features off | Edit, regenerate, cancel, branching, attachments: don't provide those handlers, so the buttons never appear |
| Routing | React Router (declarative mode). Routes: `/login`, `/register`, `/` (new chat), `/c/:id` (a conversation) |
| HTTP | The existing Axios install, one shared client, relative URLs (`/api/...`), Vite proxy in dev |
| Icons | Lucide (`lucide-react`) only, since shadcn and assistant-ui already use it |
| Look | Light theme only (remove dark variants), shadcn neutral palette, no custom animations |
| Markdown | assistant-ui's markdown component for assistant replies; **raw HTML rendering stays off** |
| Failed AI reply | Derived from the data: if the last message is from the user and nothing is running, it has no reply. Show a notice there; sending the same text again reuses the saved message (backend "send again" rule). No automatic retry button in v1 |
| Streaming | Not in v1 |

---

## Phase 0: Backend prep (backend root, small changes only)

**0.1 Check `store` when the AI fails.** `POST /api/conversations` creates the conversation and saves the first message *before* the AI call. If the AI then fails, does the error response include the new conversation's id? Write a feature test with a faked failure and look at the JSON.
- If it doesn't, the frontend can't know which conversation was created, and the user's "send again" creates a second one. Small fix: include the conversation id in that error response.

**0.2 Add `GET /api/usage`.** Uses the existing credits service. Returns the user's tier, today's allowance (from config, by tier), credits used today, and remaining. Inside the existing `auth:sanctum` group. Add a feature test.

**0.3 Generate `docs/api-contract.md`.** A read-only Claude Code session in the backend root (Boost available):

> Read `routes/api.php`, the controllers, Form Requests, API Resources and feature tests. Write `docs/api-contract.md` (project root) documenting every endpoint, including Sanctum's `/sanctum/csrf-cookie`: method and path, whether login is required, request fields with their validation rules, the exact success JSON with status code, and every error status the endpoint can return with its JSON shape (401, 403/404, 419, 422, 429, 502 where relevant). Take shapes from the Resources and tests, not guesses. Do not modify any other file.

**You review it** against your own knowledge before Phase 1. This file is how the frontend learns the backend.

**0.4 Commit.**

---

## Phase 1: Foundations (UI only, mocked data)

- Create a git branch (e.g. `frontend-ui`) before anything runs.
- Plan mode: Claude Code inspects `frontend/` (package.json, Vite and tsconfig files, `src/`) and reports what `init` will need.
- Add the `@/` import alias (tsconfig files **and** Vite config), as shadcn requires.
- Run `npx assistant-ui@latest init`. Then inspect what it generated and **remove anything wired to a default `/api/chat` route or the AI SDK**.
- Remove dark-mode variants from the generated CSS. Keep the neutral palette.
- Install React Router; set up the four routes with placeholder pages.
- `/` shows the `Thread` with a sidebar, using a mock `ExternalStoreRuntime` that echoes a fake reply.

**Acceptance:** `npm run dev`, open `localhost:5173`, type a message, see a fake reply in a complete-looking chat layout. `npm run build` and `npm run lint` pass.

---

## Phase 2: API client and authentication

- One Axios instance: `withCredentials` on, relative base URL, JSON headers.
- Before login and register: `GET /sanctum/csrf-cookie`.
- One error helper that turns responses into something the UI can show:
  - 401 → not logged in → go to `/login`
  - 419 → session/CSRF expired → refresh the CSRF cookie and ask the user to try again
  - 422 → show the field errors from `errors` next to the matching inputs
  - 429 → out of credits
  - 502 / network error → "The AI couldn't respond, try again"
- Auth state in one React context: on app load call `GET /api/user`; logged in or not.
- Register page (name, email, password, password confirmation). Success (201) logs the user in, so go straight to `/`.
- Login page, logout in a small user menu.
- Protected routes: `/` and `/c/:id` need a user; `/login` and `/register` redirect away if already logged in.

**Acceptance:** register a new user, see the chat page; refresh, still logged in; log out, sent to login; log in again; wrong password and duplicate email show readable errors.

---

## Phase 3: Real chat (the core)

- Replace the mock runtime. Messages live in React state in Laravel's shape; `convertMessage` maps them for assistant-ui (numeric id → string).
- **New chat** (`/`, no conversation id): sending calls `POST /api/conversations`, then navigates to `/c/{id}` without reloading.
- **Existing chat** (`/c/:id`): load with `GET /api/conversations/{id}`; sending calls `POST /api/conversations/{id}/messages` and **appends only the new messages it returns**.
- On send: show the user's message straight away with a temporary id, set `isRunning` (assistant-ui shows its loading indicator), then replace the temporary message with the real ones from the response.
- **Merging returned messages:** the messages endpoint returns `user_message` + `assistant_message`. If `user_message.id` already exists in state (the backend reused a failed message), **replace** that message instead of appending, so it never shows twice. Always remove the temporary optimistic message.
- **Failure on a new chat:** a 502 from `POST /api/conversations` includes `conversation_id`. Navigate to `/c/{conversation_id}` so the user is in the saved conversation; any follow-up uses the messages endpoint.
- **"No reply" state is derived, not stored:** when the last message has role `user` and nothing is running, show a short notice under it ("No reply. Send your message again to retry"). This also works after a refresh or navigation, because it comes from the data rather than from a one-off error in component state. Show the specific error text (502, 429, network) when you have it.
- The composer stays usable after any failure.
- Assistant replies render markdown with raw HTML disabled.
- Sending is blocked while a reply is in progress (the runtime does this by default).

**Acceptance:** start a chat, get a real reply; send follow-ups and the AI remembers context; refresh on `/c/:id` and the conversation reloads; markdown and code blocks render; stop `php artisan serve` mid-chat and see a readable error.

---

## Phase 4: Sidebar

- `ExternalStoreThreadListAdapter` fed from `GET /api/conversations` (newest first).
- Click → navigates to `/c/{id}`. The **URL is the single source of truth for the current conversation** (avoids messages going to the wrong thread).
- New chat → `/`. After the first message, the new conversation appears at the top of the list.
- Rename → `PATCH`, delete → `DELETE` with a confirm step; deleting the open conversation goes back to `/`.
- Small screens: sidebar collapses behind a menu button (Lucide icon).

**Acceptance:** switch between conversations; rename survives a refresh; delete removes it; works at phone width.

---

## Phase 5: Credits and polish

- Show "credits left today" (from `GET /api/usage`) near the composer or in the sidebar; refetch after each reply. `remaining` can be negative or fractional: display it as never below 0, rounded to one decimal place.
- At 0 remaining or on a 429: disable sending (`isSendDisabled`) with a clear message.
- Empty state for a new chat (a short welcome line), loading state while a conversation loads.
- Copy-message button only if assistant-ui gives it for free.

---

## Phase 6: Manual test checklist

- Register, login, logout, refresh while logged in
- Expired session (delete the session cookie in dev tools) → back to login, no crash
- New chat, follow-ups, refresh mid-conversation, switch conversations
- Rename, delete
- AI failure (bad key in `.env` temporarily) → readable error, user can send again
- Out of credits (lower the free allowance in config temporarily)
- Second user cannot open the first user's `/c/{id}` (expect 404 handling)
- Phone width

---

## Later (not v1)

- Deployment: a refresh on `/c/42` in production needs the server to return the React `index.html` for non-API paths. Plan this when you set up cPanel.
- Streaming, regenerate, model choice, attachments.
- Sidebar order by last activity (`updated_at`) instead of creation date: needs the message model to update its conversation's timestamp, plus a one-word change to the list query.
- Remove `GET /api/ping` before deploying, or leave it as a health check.
