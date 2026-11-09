# API contract

The Laravel backend as the frontend sees it. Sources: `routes/api.php`, the controllers, the Form Requests, the models and the feature tests in `backend/tests/Feature`. There are no API Resources: responses are serialized Eloquent models or hand-built arrays.

## Conventions

- **Auth:** Sanctum SPA auth, cookie and session based (guard `web`). There are no bearer tokens.
  - Send every request with credentials (`withCredentials: true`) from a stateful origin (`SANCTUM_STATEFUL_DOMAINS`, e.g. `localhost:5173`).
  - Call `GET /sanctum/csrf-cookie` once before login or register. Axios then echoes the `XSRF-TOKEN` cookie as the `X-XSRF-TOKEN` header on every POST, PATCH and DELETE.
- **JSON:** All `/api/*` errors render as JSON, even without `Accept: application/json`. Sending `Accept: application/json` is still recommended.
- **Timestamps:** ISO 8601 UTC strings, e.g. `"2026-11-09T10:15:30.000000Z"`.
- **Ids:** Integers.
- **Credits:**
  - One credit is 1000 **output** tokens; input tokens are not counted.
  - The daily allowance comes from config by tier (`services.credits.free` / `.pro`, set via `FREE_TIER_CREDITS` / `PRO_TIER_CREDITS`).
  - "Today" is the current UTC day.
  - Credits are checked *before* a message is sent, so one reply can take `remaining` below 0.

### Object shapes

**User**
```json
{
  "id": 1,
  "name": "Ada",
  "email": "ada@example.com",
  "tier": "free",
  "email_verified_at": null,
  "created_at": "2026-11-09T10:15:30.000000Z",
  "updated_at": "2026-11-09T10:15:30.000000Z"
}
```
`password` and `remember_token` are never included (tested). `tier` is `"free"` or `"pro"`.

**Conversation**
```json
{
  "id": 7,
  "user_id": 1,
  "title": "First 50 characters of the first message...",
  "created_at": "2026-11-09T10:15:30.000000Z",
  "updated_at": "2026-11-09T10:15:30.000000Z"
}
```
A `messages` array is included only where noted below.

**Message**
```json
{
  "id": 12,
  "conversation_id": 7,
  "role": "user",
  "content": "Hello!",
  "created_at": "2026-11-09T10:15:30.000000Z",
  "updated_at": "2026-11-09T10:15:30.000000Z"
}
```
`role` is `"user"` or `"assistant"`. `content` is plain text; assistant replies may contain markdown.

### Error shapes

| Status | When | Body |
|---|---|---|
| 401 | Not logged in, on any endpoint that requires login | `{"message": "Unauthenticated."}` |
| 404 | Conversation doesn't exist **or belongs to another user** (the two look the same) | `{"message": "No query results for model [App\\Models\\Conversation] 7"}`. Don't rely on the text |
| 419 | CSRF cookie missing or expired, or session expired, on POST, PATCH or DELETE | `{"message": "CSRF token mismatch."}` |
| 422 | Validation failed | `{"message": "<first error>", "errors": {"<field>": ["<msg>", ...]}}` |
| 429 | Login throttle | `{"message": "Too Many Attempts."}`, with a `Retry-After` header (seconds) |
| 429 | No credits left today | `{"message": "Insufficient credits"}` |
| 502 | The AI provider failed: an error status, a timeout (15 s) or a network error | `{"message": "Failed to send message to AI"}`; `POST /api/conversations` adds `"conversation_id"` |
| 500 | Server error, including a user tier missing from config (`{"message": "Invalid tier"}`) | `{"message": "Server Error"}` |

---

## Endpoints

### `GET /sanctum/csrf-cookie`
- **Login:** not required.
- **Request:** none.
- **Success:** `204`, empty body. Sets the `XSRF-TOKEN` cookie (and the session cookie).
- **Errors:** none expected.

### `GET /api/ping`
A dev check that the Vite proxy works.
- **Login:** not required.
- **Success:** `200` `{"message": "pong", "timestamp": "2026-11-09T10:15:30.000000Z"}`

### `POST /api/register`
- **Login:** not required. It isn't blocked for a logged-in user.
- **Request:**

| Field | Rules |
|---|---|
| `name` | required, string, max 255 |
| `email` | required, string, email, max 255, unique among users |
| `password` | required, string, min 8, confirmed |
| `password_confirmation` | must match `password` |

- **Success:** `201` with the **User** object (top level, not wrapped). The user is logged in at once and the session is regenerated.
- **Errors:** `422` (for example `errors.email` when the email is already taken, or `errors.password` for too short or not matching); `419`.

### `POST /api/login`
- **Login:** not required.
- **Throttle:** 5 requests per minute; the 6th returns `429` (tested).
- **Request:**

| Field | Rules |
|---|---|
| `email` | required, string, email |
| `password` | required, string |

- **Success:** `200` `{"message": "Login successful", "user": { User }}`. The session is regenerated.
- **Errors:**
  - `422`: wrong email or password gives `{"message": "The provided credentials are incorrect.", "errors": {"email": ["The provided credentials are incorrect."]}}`. A missing field gives the normal field errors.
  - `429` (throttle).
  - `419`.

### `POST /api/logout`
- **Login:** required.
- **Request:** none.
- **Success:** `204`, empty body. The session is invalidated and the CSRF token regenerated. Fetch `/sanctum/csrf-cookie` again before the next login.
- **Errors:** `401`, `419`.

### `GET /api/user`
Call this on app load to find out whether the user is logged in.
- **Login:** required.
- **Success:** `200` with the **User** object (top level).
- **Errors:** `401` means not logged in.

### `GET /api/usage`
- **Login:** required.
- **Success:** `200`
```json
{
  "tier": "free",
  "daily_allowance": 10,
  "used_today": 2.5,
  "remaining": 7.5
}
```
  - All three numbers are credits and may be integers or decimals.
  - `remaining` is `daily_allowance - used_today` and can be negative.
  - Sending is refused (`429`) when `remaining <= 0`.
- **Errors:** `401`; `500` if the user's tier isn't in config.

### `GET /api/conversations`
- **Login:** required.
- **Success:** `200`, an array of **Conversation** objects belonging to the current user, newest first (`created_at` desc). Each has **no** `messages` key (tested).
- **Errors:** `401`.

### `POST /api/conversations`
Starts a new chat with its first message and gets the AI reply.
- **Login:** required.
- **Request:**

| Field | Rules |
|---|---|
| `content` | required, string, max 4000 |

Any other field (such as `title`) is ignored. The title is always the first 50 characters of `content`, with `...` appended when cut.

- **Order:**
  1. Validation (`422`).
  2. Credits check (`429`, nothing saved).
  3. Create the conversation.
  4. Save the user message.
  5. Call the AI.
  6. Save the assistant reply and the usage.
- **Success:** `201` with the **Conversation** object plus `messages`: `[ user message, assistant reply ]`, ordered by id.
```json
{
  "id": 7, "user_id": 1, "title": "Hello!",
  "created_at": "...", "updated_at": "...",
  "messages": [
    {"id": 12, "conversation_id": 7, "role": "user", "content": "Hello!", "created_at": "...", "updated_at": "..."},
    {"id": 13, "conversation_id": 7, "role": "assistant", "content": "Hi! How can I help?", "created_at": "...", "updated_at": "..."}
  ]
}
```
- **Errors:**
  - `422`, `429` (credits): no conversation is created.
  - `502` `{"message": "Failed to send message to AI", "conversation_id": 7}`: the conversation **and** the user message are saved; there is no assistant reply.
    - The frontend should navigate to `/c/7`.
    - "Send again" must use `POST /api/conversations/7/messages` with the same content, not this endpoint.
  - `401`, `419`.

### `GET /api/conversations/{id}`
- **Login:** required.
- **Success:** `200` with the **Conversation** object plus `messages` (all of them, ordered by id ascending).
- **Errors:** `401`; `404` (not found or not yours).

### `POST /api/conversations/{id}/messages`
Sends a follow-up message, or re-sends after a failure.
- **Login:** required.
- **Request:**

| Field | Rules |
|---|---|
| `content` | required, string, max 4000 |

- **Order:**
  1. Ownership (`404`).
  2. Validation (`422`).
  3. Credits (`429`).
  4. Save the user message (see "send again" below).
  5. Call the AI with the whole conversation history.
  6. Save the reply and the usage.
- **Success:** `201`. Contains only the two messages from this exchange; append them to the existing list.
```json
{
  "user_message": { Message },
  "assistant_message": { Message }
}
```
- **Send again:** if the conversation's latest message is a user message with **exactly the same `content`** (the previous attempt failed), that message is reused instead of saved a second time.
  - `user_message.id` is the id of the message already saved.
  - Different content always creates a new user message.
- **Errors:**
  - `502` `{"message": "Failed to send message to AI"}`: the user message is saved and there is no reply.
  - `401`, `404`, `419`, `422`, `429` (credits).

### `PATCH /api/conversations/{id}`
Renames a conversation.
- **Login:** required.
- **Request:**

| Field | Rules |
|---|---|
| `title` | required, string, max 255 |

- **Success:** `200` with the updated **Conversation** object (no `messages`).
- **Errors:** `401`, `404`, `419`, `422`.

### `DELETE /api/conversations/{id}`
- **Login:** required.
- **Success:** `204`, empty body. The conversation's messages are deleted with it (cascade).
- **Errors:** `401`, `404`, `419`.
