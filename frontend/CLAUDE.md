# ai-chat frontend

React 19 + TypeScript + Vite + Tailwind v4 SPA for a ChatGPT-style app. The backend is a separate Laravel API in `../backend` that you cannot see and must not change. Everything you need to know about it is in the API contract below.

@../docs/api-contract.md
@../docs/frontend-plan.md

## How we work

- Work **one phase** of the frontend plan at a time. Start with a plan; don't write files until it is approved.
- At the end of a phase, stop and list what to test manually. Don't start the next phase.
- I am learning: explain new concepts briefly and in plain language when you introduce them.
- If the contract doesn't answer a question about the backend, **ask me**. Never guess an endpoint, field or response shape.
- If a small backend change seems necessary, describe it and stop. Don't work around it in the frontend.

## Must do

- Use assistant-ui's prebuilt components (`Thread`, thread list, markdown) with **`ExternalStoreRuntime`** and `ExternalStoreThreadListAdapter`.
- Before using an assistant-ui API, read its current docs (the `.md` pages, index at assistant-ui.com/llms.txt). The library changes quickly; don't rely on memory.
- All HTTP through the one shared Axios client, relative URLs (`/api/...`), cookies sent (Sanctum SPA auth). Call `/sanctum/csrf-cookie` before login/register.
- Laravel is the source of truth: display what the API returns. After sending, merge the returned messages by id (replace if the id already exists, otherwise append); never refetch the whole conversation just to add them.
- Handle loading, empty and error states (401, 419, 422, 429, 502, network).
- Icons: `lucide-react` only. Light theme only, shadcn neutral palette, no custom animations.
- Markdown for assistant replies with raw HTML rendering disabled.
- Keep components small and typed; no `any`.

## Must not

- Create a new app, migrate to Next.js, or use `npx assistant-ui create`.
- Use `LocalRuntime`, history adapters, Assistant Cloud, the AI SDK, or any `/api/chat` route.
- Add a second auth system, bearer tokens, or store tokens in localStorage.
- Put any API key or secret in frontend code.
- Add streaming, edit, regenerate, cancel, branching or attachments.
- Hardcode `localhost:8000` (dev requests go through the Vite proxy).
- Edit anything outside `frontend/`, or make unrelated changes.

## Commands

- `npm run dev`: dev server at localhost:5173 (always open this address, not 127.0.0.1, for the Sanctum cookie)
- `npm run build`: type-check and build
- `npm run lint`: oxlint
