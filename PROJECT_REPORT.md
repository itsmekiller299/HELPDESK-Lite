# HelpDesk Lite — Complete Project Report

**Generated:** Aug 16, 2026
**Repository:** https://github.com/itsmekiller299/HELPDESK-Lite.git
**Live site:** https://frontend-ecru-three-34.vercel.app
**Live API:** https://helpdesk-api-psi.vercel.app/api

---

## 1. Project Overview

HelpDesk Lite is a lightweight customer-support ticketing platform built for a district-level hackathon. Customers file tickets, agents triage and resolve them, and admins monitor analytics — all wrapped in a modern LiquidGlass (frosted-glass) UI with a custom customer-service logo (support headset + live-chat badge).

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5 |
| Styling | Tailwind CSS 4, LiquidGlass theme (`globals.css` CSS variables) |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Backend | Node.js, Express 4 |
| Database | SQL.js (SQLite, local + Vercel) **or** MySQL via `mysql2` (AWS RDS) — auto-switched by `DB_HOST` |
| Auth | JWT (`jsonwebtoken`), bcryptjs password hashing |
| Email | Nodemailer (SMTP, optional) |
| Deploy | Vercel (frontend + backend), AWS EC2/RDS scripts ready |

---

## 3. Repository Layout

```
HelpDesk Lite/
├── backend/
│   ├── api/index.js            # Vercel serverless entry
│   ├── deploy/
│   │   ├── ec2-setup.sh        # EC2 provisioning script (Ubuntu + systemd)
│   │   └── helpdesk-api.service# systemd unit for EC2 API
│   ├── src/
│   │   ├── app.js              # createApp() shared by local + serverless
│   │   ├── server.js           # Local entry (listens on PORT 4000)
│   │   ├── db/
│   │   │   ├── schema.js       # Async dual SQLite/MySQL layer + table defs
│   │   │   ├── seed.js         # Demo data seeder
│   │   │   └── wasm.js         # Embedded sql.js WASM (base64) for serverless
│   │   ├── middleware/auth.js  # authenticate + requireRole guards
│   │   ├── routes/             # auth, tickets, comments, kb, analytics, users, notifications
│   │   ├── services/
│   │   │   ├── auto-assign.js   # Skill/workload-based agent assignment
│   │   │   ├── auto-responder.js# Instant bot replies per category/priority
│   │   │   ├── email.js         # Nodemailer SMTP transport
│   │   │   └── summary.js       # Extractive TL;DR summarizer
│   │   └── utils/validation.js  # Input validators
│   └── vercel.json              # Routes all requests to /api/index.js
├── frontend/
│   └── src/
│       ├── app/                # Pages (App Router)
│       │   ├── page.tsx        # Root redirect by role
│       │   ├── login/          # Login + register
│       │   ├── dashboard/      # Admin/Agent dashboard
│       │   ├── tickets/        # List, [id] detail, new
│       │   ├── kb/             # Knowledge base
│       │   ├── admin/          # Analytics
│       │   └── profile/        # User profile
│       ├── components/         # Navbar, Logo, Badges, TldrPanel
│       └── lib/                # api.ts, auth-context.tsx, types.ts
└── README.md
```

---

## 4. Backend — API Endpoints

Base: `/api`. Auth: `Authorization: Bearer <token>`.

### Auth
| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| POST | `/auth/register` | Public | Create account |
| POST | `/auth/login` | Public | Login, returns JWT |
| GET | `/auth/me` | Any | Current user |

### Tickets
| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/tickets` | Any | List (role-scoped) |
| GET | `/tickets/suggest-classify` | Any | Rule-based category/priority suggestion |
| GET | `/tickets/:id` | Any (role-scoped) | Ticket detail |
| GET | `/tickets/:id/summary` | Any (role-scoped) | Conversation TL;DR |
| POST | `/tickets` | Any | Create (triggers auto-assign + auto-respond) |
| PATCH | `/tickets/:id` | Admin, Agent | Update / status transition |

### Comments
| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/comments/:ticketId` | Any (role-scoped) | Thread (internal notes filtered for customers) |
| POST | `/comments/:ticketId` | Any | Post reply or internal note |

### Knowledge Base
| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/kb` | Any | Articles |
| GET | `/kb/suggest` | Any | Deflection suggestions by keyword match |
| POST | `/kb` | Admin | Create article |
| PUT | `/kb/:id` | Admin | Update article |
| DELETE | `/kb/:id` | Admin | Delete article |

### Users / Analytics / Notifications
| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| PATCH | `/users/me` | Any | Update profile |
| GET | `/users` | Admin, Agent | User list |
| GET | `/users/agents` | Admin, Agent | Assignable agents |
| GET | `/analytics` | Admin, Agent | Aggregate stats for charts |
| GET | `/notifications` | Any | User notifications |
| PATCH | `/notifications/:id/read` | Any | Mark notification read |

---

## 5. Database Schema

Tables (SQLite & MySQL variants in `schema.js`): `users`, `tickets`, `comments`, `notifications`, `knowledge_base`.

- **users** — id, name, email, password (bcrypt hash), role (`Admin`/`Agent`/`Customer`), skills, created_at
- **tickets** — id, subject, description, category, priority, status (`open/in_progress/resolved/closed`), requester_id, assignee_id, created_at
- **comments** — id, ticket_id, user_id, body, `is_internal` (0 = public, 1 = internal note), created_at
- **notifications** — id, user_id, ticket_id, message, is_read, created_at
- **knowledge_base** — id, title, body, keywords, created_at

---

## 6. Backend Services (business logic)

- **`auto-assign.js`** — `ensureAgentSkills()`, `rankAgents()`, `pickBestAgent()`, `autoAssignTicket()`. Picks the best agent by skill match + lowest open workload; excludes bot accounts.
- **`auto-responder.js`** — `ensureAutoAgents()`, `autoRespondToTicket()`. Creates seeded bot agents and posts an instant first reply by category (Technical/Billing/General/Priority Support Bot). Bots are excluded from manual assignment lists.
- **`summary.js`** — `summarizeConversation()`: sentence-split, keyword-frequency scoring, positional weighting → extracts key points, open questions, participants, and facts (status/priority/assignee/reply count). No external AI API — fully offline extractive summarization.
- **`email.js`** — `sendTicketEmail()`: optional SMTP notifications on ticket creation and public replies; internal notes are never emailed.

---

## 7. Frontend — Pages & Features

| Page | Route | Roles | Features |
|------|-------|-------|----------|
| Root | `/` | — | Redirects by role (customer → /tickets, else → /dashboard) |
| Login | `/login` | Public | Login + register tabs, demo-account autofill, show/hide password |
| Dashboard | `/dashboard` | Admin, Agent | Ticket stats, status/priority breakdown, recent tickets |
| Tickets | `/tickets` | All | Role-scoped list, filters, SLA badges, status badges |
| New Ticket | `/tickets/new` | All | Create with rule-based auto-classify suggestion |
| Ticket Detail | `/tickets/[id]` | All | Thread (public + internal notes), status actions, **Conversation TL;DR panel** |
| Knowledge Base | `/kb` | All | Article list, admin CRUD, keyword deflection |
| Analytics | `/admin` | Admin, Agent | Recharts bar + pie charts from `/analytics` |
| Profile | `/profile` | All | Edit name/password |

### Reusable components
- `Navbar.tsx` — responsive glass nav, role-based links, notifications bell, light/dark theme toggle
- `Logo.tsx` — custom customer-service logo (headset + live-chat badge), used in nav, login, favicon
- `Badges.tsx` — status/priority/SLA pills
- `TldrPanel.tsx` — one-click "Conversation TL;DR" with Generate button

### Lib layer
- `api.ts` — typed fetch wrappers; `API_BASE = NEXT_PUBLIC_API_URL || http://localhost:4000/api`
- `auth-context.tsx` — login/register/logout, JWT persistence in localStorage, role guard
- `types.ts` — Ticket, User, Comment, Notification, TicketSummary types

---

## 8. Key Features (all shipped)

1. **Auth & Roles** — Admin / Agent / Customer, JWT-protected routes, role guards
2. **Ticket Management** — full lifecycle: Open → In Progress → Resolved → Closed (+ reopen)
3. **SLA Indicator** — computed on-read: On Track / At Risk / Breached
4. **Conversation Thread** — public replies + internal notes (hidden from customers)
5. **Rule-Based AI Classification** — keyword auto-suggest of category + priority
6. **Auto-Assignment** — best agent by skill + workload
7. **Auto-Responder Bots** — instant first reply per category / priority escalation
8. **Dashboard & Analytics** — real aggregations, Recharts charts
9. **Knowledge Base + Deflection** — admin CRUD + keyword suggestions
10. **Conversation TL;DR** — one-click AI-style summary (key points, open questions, participants)
11. **Notifications** — bell with unread badge, mark-read navigation to ticket
12. **Email (optional)** — SMTP for creation + public replies
13. **Custom Branding** — customer-service logo + SVG favicon
14. **LiquidGlass UI** — frosted glass, gradients, light/dark themes, responsive

---

## 9. Local Setup — Steps Used

### Backend (port 4000)
```bash
cd backend
npm install
cp .env.example .env        # JWT_SECRET, CORS_ORIGIN incl. Vercel URL
npm run seed                # demo data (5 users, 6 tickets, comments, KB)
npm run dev                 # node --watch src/server.js
```
Health check: `curl http://localhost:4000/api/health`

### Frontend (port 3000)
```bash
cd frontend
npm install
npm run dev                 # next dev
```
Open http://localhost:3000. `NEXT_PUBLIC_API_URL` falls back to `http://localhost:4000/api`.

---

## 10. Deployment — Actual State

| Component | Where | URL | Env vars |
|-----------|-------|-----|----------|
| Frontend | Vercel (production) | https://frontend-ecru-three-34.vercel.app | `NEXT_PUBLIC_API_URL=https://helpdesk-api-psi.vercel.app/api` |
| Backend | Vercel (serverless) | https://helpdesk-api-psi.vercel.app | `JWT_SECRET`, `CORS_ORIGIN` (frontend URL) |

### How the backend runs serverless
- `backend/vercel.json` routes all traffic to `api/index.js`
- `app.js` exports `createApp()`; `server.js` (local) and `api/index.js` (Vercel) both use it
- On Vercel, `DB_PATH` = `/tmp/helpdesk.db`; the bundled `helpdesk.db` is copied there on first init; `wasm.js` embeds sql.js WASM (base64) so it loads with no filesystem issues
- **Limitation:** `/tmp` is ephemeral on Vercel — writes reset on cold starts. MySQL/RDS remains the persistence path.

### Deploy commands used
```bash
# frontend
cd frontend && npx vercel deploy --prod --yes

# backend
cd backend && npx vercel deploy --prod --yes
npx vercel env add JWT_SECRET production
npx vercel env add CORS_ORIGIN production
```

### AWS EC2 + RDS (planned, scripts ready)
Backend is designed to switch to MySQL when `DB_HOST` is set. `deploy/ec2-setup.sh` + `helpdesk-api.service` install Node, clone repo, seed RDS, and run the API as a systemd service. **Not yet provisioned** — IAM user `Shiva11062007` had read-only permissions; security groups (`helpdesk-ec2-sg`, `helpdesk-rds-sg`) were created, but EC2/RDS creation was denied. Pivot: backend deployed to Vercel.

---

## 11. Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@helpdesk.com | admin123 |
| Agent | shiva123@gmail.com | agent123 |
| Agent | mani123@gmail.com | agent123 |
| Customer | customer@helpdesk.com | customer123 |
| Customer | sarah@helpdesk.com | customer123 |

---

## 12. Testing & Verification

- Backend unit tests: `npm test` (`node --test`) — **11/11 passing**
- Frontend checks: `npm run lint` (ESLint) + `npx tsc --noEmit` — clean
- Live API smoke tests: login, tickets, analytics, users/agents, notifications, KB, comments, and TL;DR summary all return **200**; CORS preflight + actual requests verified from the frontend origin
- Security verified: customers' TL;DR and threads exclude internal notes; cross-customer ticket access returns **403**

---

## 13. Git History (root repo → origin/main)

- `5b20041` Conversation TL;DR summary endpoint
- `373fad5` README localhost URLs + TL;DR feature
- `00e27dd` AWS deployment support: MySQL/RDS backend + EC2 setup
- `b021974` Deploy backend to Vercel serverless with embedded WASM
- Frontend is a nested repo (commit `118a98b` → `35ac2fa`; no remote)

---

## 14. Current Status & Known Limitations

✅ Everything deployed and reachable; full browser→API flow verified.
- Vercel backend DB is ephemeral (`/tmp`) — **use a persistent MySQL/RDS for production data**
- SMTP email disabled until `.env` SMTP values are configured
- TL;DR is extractive (keyword-frequency) — no paid AI API required
- AWS EC2/RDS scripts ready but unprovisioned (needs IAM write permissions)