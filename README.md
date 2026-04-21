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

3. Run API and worker in separate terminals:

```bash
npm run dev:api
```

```bash
npm run dev:worker
```

## API summary

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

## Example requests

Google login:

```bash
curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"<google_id_token>"}'
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

