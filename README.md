# TaskPulse

TaskPulse is an org-scoped task assignment system that delivers tasks to team members via **Twilio WhatsApp** and tracks completion in real time. Members reply with `DONE`, `HELP`, or `DELAY` directly in WhatsApp — no app install required.

---

## Features

- **Google OAuth** sign-in (ID token flow)
- **Org management** — create an org or join with an invite code
- **RBAC** — Owner / Admin / Manager / Member roles
- **Groups** — organise members into groups, scope tasks to a group
- **Task lifecycle** — Draft → Approved → Queued → Sent → Completed
- **Task templates** — save reusable tasks and instantiate them on demand
- **WhatsApp delivery** — BullMQ worker sends messages via Twilio; webhook parses replies
- **Live updates** — SSE stream pushes task events to the dashboard in real time
- **Phone onboarding** — users link their phone number before receiving messages

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, React Router 7, Tailwind CSS 4, TanStack Query, react-hook-form, Zod, Framer Motion |
| **Backend** | Node.js (ESM), Express, Mongoose (MongoDB), BullMQ + ioredis (Redis), Twilio, Pino, Helmet, Zod |
| **Auth** | Google OAuth (ID token), JWT |
| **Infra (prod)** | Vercel (frontend), Render (backend API + worker in one service), MongoDB Atlas, Redis Cloud |

---

## Project Structure

```
TaskPulse/
├── client/                  # Vite + React SPA
│   ├── src/
│   │   ├── auth/            # AuthProvider, AuthContext, useAuth hook
│   │   ├── components/      # Shared UI components
│   │   ├── hooks/           # React Query queries & mutations
│   │   ├── lib/             # apiClient, queryClient
│   │   ├── pages/           # Admin and member page components
│   │   └── routes/          # Route guards (RequireAuth, RequireRole), page routes
│   └── vercel.json          # SPA rewrite rule for Vercel
│
└── server/                  # Express API + BullMQ worker
    ├── src/
    │   ├── config/          # DB, Redis, env, logger, Twilio init
    │   ├── controllers/     # Route handlers
    │   ├── middlewares/     # auth, RBAC, error, validation, Twilio signature
    │   ├── models/          # Mongoose models
    │   ├── queue/           # BullMQ queue definitions
    │   ├── routes/          # Express routers
    │   ├── schemas/         # Zod request schemas
    │   ├── services/        # Business logic
    │   ├── utils/           # JWT, sanitize, Google token verify
    │   ├── workers/         # BullMQ task worker
    │   ├── server.ts        # API entry point (also starts worker in prod)
    │   └── worker.ts        # Standalone worker entry point (local dev)
    └── scripts/             # Dev utilities (reset DB, test WhatsApp)
```

<img width="1584" height="498" alt="Screenshot 2026-04-25 172333" src="https://github.com/user-attachments/assets/6044d75d-65af-415a-8ff3-7fd8610e8ed7" />


---

## Local Development

### Prerequisites

- Node.js 20+
- MongoDB running locally (`mongodb://localhost:27017`)
- Redis running locally (`redis://localhost:6379`)
- A Google Cloud project with an OAuth 2.0 client ID
- A Twilio account with a WhatsApp Sandbox number

### 1. Clone and install

```bash
git clone https://github.com/your-username/TaskPulse.git
cd TaskPulse

cd server && npm install
cd ../client && npm install
```

### 2. Configure environment variables

**`server/.env`**

```env
NODE_ENV=development
PORT=3000
PUBLIC_URL=https://your-ngrok-url.ngrok-free.app  # or http://localhost:3000

CLIENT_ORIGIN=http://localhost:5173

MONGO_URI=mongodb://localhost:27017/taskpulse
REDIS_URL=redis://localhost:6379

JWT_SECRET=your-secret-at-least-32-chars-long
JWT_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Set to true only in development when using ngrok (disables Twilio webhook signature check)
TWILIO_SKIP_SIGNATURE=true
```

**`client/.env`**

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 3. Run

```bash
# Terminal 1 — API + worker (concurrent)
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

The app will be at `http://localhost:5173`.

---

## Deployment

### Frontend — Vercel

1. Connect the repo to Vercel, set **Root Directory** to `client`
2. Add environment variables:
   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://your-api.onrender.com` |
   | `VITE_GOOGLE_CLIENT_ID` | Your Google client ID |

The `client/vercel.json` already handles SPA routing (all paths serve `index.html`).

### Backend — Render

Deploy a single **Web Service** from the `server` directory.

| Setting | Value |
|---|---|
| **Root Directory** | `server` |
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `npm run start:api` |

Required environment variables:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PUBLIC_URL` | `https://your-api.onrender.com` |
| `CLIENT_ORIGIN` | `https://your-app.vercel.app` |
| `MONGO_URI` | MongoDB Atlas connection string |
| `REDIS_URL` | Redis Cloud connection URL |
| `JWT_SECRET` | A strong random secret (32+ chars) |
| `JWT_EXPIRES_IN` | `7d` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `TWILIO_ACCOUNT_SID` | From Twilio Console |
| `TWILIO_AUTH_TOKEN` | From Twilio Console |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+14155238886` |
| `LOG_LEVEL` | `info` |

The worker runs inside the same process as the API (started in `server.ts`). No separate worker service is needed.

### Google Cloud Console

In your OAuth 2.0 client, add your Vercel URL to **Authorized JavaScript origins**:
```
https://your-app.vercel.app
```

### Twilio Sandbox Webhook

In Twilio Console → Messaging → WhatsApp Sandbox → Sandbox Settings, set:

| Field | Value |
|---|---|
| **When a message comes in** | `https://your-api.onrender.com/webhooks/twilio-incoming` (POST) |
| **Status callback URL** | `https://your-api.onrender.com/webhooks/twilio-status` (POST) |



