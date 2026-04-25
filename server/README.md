# TaskPulse (Backend)

Backend for a task assignment system that sends WhatsApp notifications via Twilio, with delivery tracking and user response handling.

## Requirements

- Node.js 20+
- MongoDB
- Redis (for BullMQ)
- A Twilio WhatsApp sender (Sandbox or approved WhatsApp sender)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill in values.

3. Run API + worker together:

```bash
npm run dev
```

(Or run `npm run dev:api` and `npm run dev:worker` in two terminals.)

## API summary

- `POST /auth/dev-login` — **development only**: mint a JWT for a test user (email, optional `role`, optional `phone` E.164); returns `404` in production
- `POST /auth/google` — exchange Google ID token for a JWT
- `PATCH /auth/me/phone` — link your E.164 phone (required for WhatsApp delivery)
- `POST /tasks` (admin) — create a task in `DRAFT`
- `POST /tasks/:id/approve` (admin) — approve + enqueue WhatsApp notifications (immediate or delayed via `scheduledAt`)
- `POST /tasks/:id/reschedule` (admin) — reschedule notifications by updating the delayed job
- `GET /tasks` — list tasks (admin: all; member: assigned only)
- `GET /tasks/:id` — task detail + assignments
- `POST /webhooks/twilio-status` — Twilio status callback (signed)
- `POST /webhooks/twilio-incoming` — inbound replies like `DONE` (signed)

## Twilio webhooks (local development)

Twilio needs a public URL to reach your local machine. Use a tunnel (e.g. ngrok) and set `PUBLIC_URL` to the tunneled base URL.

- Delivery status callback: `POST /webhooks/twilio-status`
- Incoming messages: `POST /webhooks/twilio-incoming`

These webhook routes verify `X-Twilio-Signature`, so `PUBLIC_URL` must match the exact base URL Twilio calls.

If ngrok URL tweaks cause signature failures during setup only, you can set `TWILIO_SKIP_SIGNATURE=true` in `.env` **while `NODE_ENV` is not `production`** — then turn it off once `PUBLIC_URL` matches Twilio exactly.

## Tonight: Twilio WhatsApp Sandbox (end-to-end)

Use this flow to verify send, delivery callbacks, and `DONE` replies without a Google OAuth frontend.

### 1) Prerequisites

- Twilio account with **WhatsApp Sandbox** enabled (Console → Messaging → Try it out → WhatsApp).
- Each test phone must **join the sandbox** (send the join phrase from WhatsApp to the Twilio sandbox number shown in the console).
- `npm run dev` running with valid `.env`: `MONGO_URI`, `REDIS_URL`, Twilio vars, `JWT_SECRET`, `GOOGLE_CLIENT_ID` (still required by env schema), `PUBLIC_URL`.

### 2) ngrok + `PUBLIC_URL`

```bash
ngrok http 3000
```

Copy the **https** forwarding URL (e.g. `https://abc123.ngrok-free.app`) and set in `.env`:

```env
PUBLIC_URL=https://abc123.ngrok-free.app
```

Restart `npm run dev`.

### 3) Twilio Sandbox webhooks

In Twilio Console (WhatsApp Sandbox settings), set:

- **When a message comes in**: `POST` → `{PUBLIC_URL}/webhooks/twilio-incoming`
- **Status callback URL** (if the UI offers it for sandbox): `{PUBLIC_URL}/webhooks/twilio-status`  
  (Outbound sends from this app also set `statusCallback` on each message.)

### 4) Twilio credentials sanity check

```bash
TWILIO_TEST_TO=+91xxxxxxxxxx npm run twilio:ping
```

Use your personal WhatsApp number in E.164 (same number that joined the sandbox). You should receive `TaskPulse ping…` on WhatsApp.

### 5) Create users and run the task flow

**Admin** (get JWT):

```bash
curl -s -X POST http://localhost:3000/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.local","name":"Admin","role":"admin","phone":"+91xxxxxxxxxx"}'
```

**Member** (get `user.id` from response):

```bash
curl -s -X POST http://localhost:3000/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email":"member@test.local","name":"Member","role":"member","phone":"+91yyyyyyyyyy"}'
```

Create task (replace `ADMIN_JWT` and `MEMBER_OBJECT_ID`):

```bash
curl -s -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Tonight test\",\"description\":\"Reply DONE when finished\",\"assignedTo\":[\"MEMBER_OBJECT_ID\"]}"
```

Approve (replace `TASK_ID`):

```bash
curl -s -X POST http://localhost:3000/tasks/TASK_ID/approve \
  -H "Authorization: Bearer ADMIN_JWT"
```

The member’s phone should get a WhatsApp task message. Reply **`DONE`** (case-insensitive). Check `GET /tasks/TASK_ID` with the admin JWT — assignments should move to `COMPLETED` when all recipients are done.

### 6) Logs

- API logs Mongo connect + listen; worker logs job completion.
- Redis logs **Redis ready** (or errors) on connect.
- Twilio logs **Twilio client initialized** with a short Account SID prefix and `from` (never the auth token).

## Example requests

Google login:

```bash
curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"<google_id_token>"}'
```

Dev login (development only):

```bash
curl -X POST http://localhost:3000/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@test.local","name":"You","role":"admin","phone":"+14155552671"}'
```

Link phone (E.164):

```bash
curl -X PATCH http://localhost:3000/auth/me/phone \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+14155552671"}'
```

Create task (admin):

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Check inventory",
    "description":"Count items on shelf A3",
    "assignedTo":["<userId1>","<userId2>"],
    "deadline":"2026-05-01T00:00:00.000Z"
  }'
```

Approve task (admin):

```bash
curl -X POST http://localhost:3000/tasks/<taskId>/approve \
  -H "Authorization: Bearer <jwt>"
```

