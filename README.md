# HelpDesk Lite

A lightweight customer support ticketing platform built for a district-level hackathon.

## TL;DR

**HelpDesk Lite** is a full-stack customer support ticketing system with:
- **Frontend**: Next.js 16 (App Router), Tailwind CSS, Recharts, Lucide React — LiquidGlass/neumorphic UI
- **Backend**: Node.js/Express, SQLite (sql.js) locally, MySQL (RDS) in production — JWT auth, bcrypt
- **Key features**: Role-based auth (Admin/Agent/Customer), ticket lifecycle (Open→In Progress→Resolved→Closed), SLA tracking, conversation threads with internal notes, AI-powered ticket classification, dashboard analytics, knowledge base, **one-click conversation TL;DR summaries** (key points, open questions, participants)
- **Auto-responses**: 4 specialized bots (Technical, Billing, General, Priority) reply instantly on ticket creation
- **Deploy**: Frontend → Vercel, Backend → AWS EC2 (systemd), DB → AWS RDS MySQL
- **Demo accounts**: admin@helpdesk.com/admin123, shiva123@gmail.com/agent123, customer@helpdesk.com/customer123

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
9. **Conversation TL;DR** — One-click AI-style summary of the full ticket thread (key points, open questions, participants) for agents joining mid-ticket

## Run Locally

After setup, open the app in your browser:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **API health check:** http://localhost:4000/api/health

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

## Deployment

Architecture: **Frontend → Vercel**, **Backend → AWS EC2**, **Database → AWS RDS (MySQL)**.

### 1. Database — AWS RDS (MySQL 8.0)
1. In AWS Console, create an RDS instance: MySQL 8.0, `db.t3.micro`, public access **Yes**.
2. Note the endpoint, port (3306), master user + password, and create a database named `helpdesk`.
3. In the security group, allow inbound **MySQL/Aurora (3306)** from your EC2 security group.

### 2. Backend — AWS EC2 (Ubuntu)
1. Launch an Ubuntu 22.04 EC2 instance; attach a security group allowing inbound **SSH (22)** and **Custom TCP 4000**.
2. SSH in and run the setup script:
   ```bash
   sudo bash deploy/ec2-setup.sh
   ```
   The script installs Node.js, clones the repo, installs dependencies, seeds RDS, and installs a systemd service (`helpdesk-api`) that keeps the API running.
3. Edit `backend/.env` on the server and set `JWT_SECRET`, `DB_HOST`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` (RDS values), `CORS_ORIGIN` to include your Vercel URL, and `APP_URL` to the Vercel URL. Then:
   ```bash
   sudo systemctl restart helpdesk-api
   ```
4. Verify: `curl http://<EC2-PUBLIC-IP>:4000/api/health`.

### 3. Frontend — Vercel
```bash
cd frontend
npx vercel --prod
```
Set the environment variable `NEXT_PUBLIC_API_URL` to `http://<EC2-PUBLIC-IP>:4000/api` (Project → Settings → Environment Variables) and redeploy.

> Local development still uses SQLite. When `DB_HOST` is set in `backend/.env`, the app switches to MySQL (RDS) automatically.

## Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@helpdesk.com | admin123 |
| Agent | shiva123@gmail.com | agent123 |
| Agent | mani123@gmail.com  | agent123 |
| Customer | customer@helpdesk.com | customer123 |
| Customer | sarah@helpdesk.com | customer123 |

## Automatic Agent Responses
When a customer creates a ticket, the backend instantly posts an automatic response from a dedicated bot agent, visible to the customer in the ticket conversation:
| Bot | Handles |
|-----|---------|
| Technical Support Bot | Technical tickets |
| Billing Support Bot | Billing tickets |
| General Support Bot | General tickets |
| Priority Support Bot | Critical-priority tickets (escalation) |

These bot accounts are seeded automatically on server startup (`src/services/auto-responder.js`) and are excluded from the manual agent-assignment list.

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
