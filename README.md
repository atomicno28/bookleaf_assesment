# BookLeaf Author Support & Communication Portal

A full-stack technical-assignment implementation with author and admin experiences.

## Stack
- Frontend: React + Vite
- API: Node.js + Express
- Persistence: MongoDB via Mongoose
- Authentication: bcrypt password hashing + JWT bearer tokens
- AI: configurable OpenAI-compatible chat completions API; deterministic fallback when no key is configured or the provider is unavailable
- Near-real-time ticket updates: client polling every 5 seconds

## Features
- Author login and isolated book/royalty data
- Book catalog, production status, royalty summaries
- Ticket creation and ticket history with replies
- Admin ticket queue with search/status/category/priority filters
- AI classification, priority recommendation, and knowledge-base grounded draft replies
- Admin classification/priority overrides, status updates, assignment, internal notes, editable replies
- Input validation, centralized errors, API health endpoint
- Exact supplied author/book JSON dataset copied into `backend/data`
- Seed script creates demo accounts and seeds all supplied records
- Optional attachment picker in UI (assignment says upload UI only is acceptable)

## Requirements
- Node.js 22+ recommended
- MongoDB running locally or a MongoDB connection string
- Optional AI provider API key (the application still works without it)

## Run locally
### 1. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```
Backend defaults to `http://localhost:4000`.

### 2. Frontend
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the URL printed by Vite (normally `http://localhost:5173`).

## Demo credentials
The seed script creates the following local demo accounts:
- Admin: `admin@bookleaf.local` / `BookLeafAdmin!2026`
- Author: `priya.sharma@email.com` / `AuthorDemo!2026`

For demo convenience, the seed script assigns the same demo password to each imported author. This is a local evaluation convenience only; replace it with an invitation/password-reset flow for production.

## AI configuration
Set `AI_API_KEY` and optionally `AI_BASE_URL` / `AI_MODEL` in `backend/.env`. The API key is used only by the backend. Prompts include a compact policy knowledge base and the ticket's subject/description, rather than sending the full ticket history. If the provider fails or is not configured, deterministic rules classify the ticket and generate a conservative fallback draft; ticket creation and manual responses remain available.

## API overview
All routes except `GET /api/health` and `POST /api/auth/login` require a bearer token.

- `POST /api/auth/login` — email/password login
- `GET /api/auth/me` — current user
- `GET /api/books` — author's books (admin may use `?authorId=...`)
- `GET /api/tickets` — ticket list; authors only receive their own tickets, admins can filter
- `POST /api/tickets` — create ticket
- `GET /api/tickets/:id` — ticket details with public replies; admin sees internal notes
- `POST /api/tickets/:id/replies` — send a public response (admin) or author follow-up
- `PATCH /api/tickets/:id` — admin status/category/priority/assignee updates
- `POST /api/tickets/:id/notes` — add admin-only internal note
- `POST /api/tickets/:id/ai-draft` — generate classification/priority/draft response (admin)
- `GET /api/admin/summary` — queue metrics (admin)

## Architecture and trade-offs
- API, auth middleware, AI service, models, and routes are separated for readability.
- Polling every five seconds is simple to operate and sufficient for near-real-time behavior at this scale; WebSockets can be added later.
- MongoDB is used because the supplied seed data is nested around authors and books and tickets are document-oriented.
- AI uses only the current query and a compact knowledge base to reduce token use. AI output is treated as a suggestion and can be overridden by an admin.
- The demo seed credentials are intentionally convenient and must not be used in production.

## Production improvements
Use a managed database, secret manager, rate limiting, audit logs, attachment storage with malware scanning, email notifications, password reset/invitation flow, pagination, structured observability, and automated tests. Deploy only to private/restricted environments because this assignment is confidential.
