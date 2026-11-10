# ai-chat frontend

A ChatGPT-style chat app built with React, TypeScript, Vite, Tailwind and assistant-ui. It talks to the Laravel API in `../backend`.

## Commands

- `npm run dev`: start the dev server. Open http://localhost:5173 (not 127.0.0.1, or the Sanctum cookie won't work). API requests go through the Vite proxy.
- `npm run build`: type-check and build
- `npm run lint`: lint with oxlint

## Docs

- `CLAUDE.md`: project rules and how we work
- `../docs/api-contract.md`: the backend API as the frontend sees it
- `../docs/frontend-plan.md`: the phased build plan
