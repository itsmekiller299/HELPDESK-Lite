# HelpDesk Lite

A lightweight customer support ticketing platform built for a district-level hackathon.

## Tech Stack
- **Frontend:** Next.js (App Router), Tailwind CSS, Recharts, Lucide React
- **Backend:** Node.js, Express, SQLite (via sql.js)
- **Auth:** JWT-based, bcrypt password hashing
- **Design:** LiquidGlass / Neumorphic Glassmorphism theme

## Features
1. **Auth & Roles** — Admin, Agent, Customer with JWT-protected routes
2. **Ticket Management** — Full CRUD with state machine: Open → In Progress → Resolved → Closed (+ Reopened)
3. **SLA Indicator** — Computed on-read per ticket (On Track / At Risk / Breached)
4. **Conversation Thread** — Public replies and internal notes (agent/admin only)
5. **Rule-Based AI Classification** — Auto-suggests category + priority on ticket creation via keyword matching
6. **Dashboard & Analytics** — Real aggregation queries, Recharts bar/pie charts
7. **Knowledge Base** — Admin CRUD, keyword-match ticket deflection suggestions
8. **LiquidGlass UI** — Frosted glass, soft shadows, gradients, responsive design

## Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run seed    # Populate demo data
npm run dev     # Starts on http://localhost:4000
```

### Frontend
```bash
cd frontend
npm install
npm run dev     # Starts on http://localhost:3000
```

## Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@helpdesk.com | admin123 |
| Agent | agent@helpdesk.com | agent123 |
| Agent | jane@helpdesk.com | agent123 |
| Customer | customer@helpdesk.com | customer123 |
| Customer | sarah@helpdesk.com | customer123 |

## Seed Data
The seed script creates 5 users, 6 tickets (with realistic varied statuses/priorities), 6 conversation comments, and 5 knowledge base articles so the app looks populated immediately on first run.

## Project Structure
```
backend/
  src/
    db/          — schema.js (SQL.js helpers), seed.js
    routes/      — auth, tickets, comments, kb, analytics, users
    middleware/   — auth.js (JWT + role check)
    server.js    — Express entry point
frontend/
  src/
    app/         — Next.js App Router pages
    components/  — Navbar, Badges (reusable UI)
    lib/         — api.ts (fetch wrappers), auth-context.tsx
```
# HelpDesk Lite

## Email delivery

Outbound ticket email uses SMTP and is disabled until configured. Copy the SMTP entries from [`backend/.env.example`](backend/.env.example) into `backend/.env`, then set values from your email provider. Port 587 normally uses `SMTP_SECURE=false`; port 465 normally uses `SMTP_SECURE=true`.

Email is sent for ticket creation and public replies. Internal notes are never emailed to customers.
