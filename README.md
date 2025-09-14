# Buyer Lead Intake — Mini App

Small lead intake app implementing the assignment requirements: capture, list, and manage buyer leads with validation, CSV import/export, history, and basic analytics.

## Assignment summary

- Stack: Next.js (App Router) + TypeScript, Supabase/Postgres, Drizzle migrations, Zod, React Hook Form.
- Auth: Supabase magic-link.
- Deliverables: CRUD, SSR list with pagination/filters, CSV import/export, migrations, validation, tests, rate limit, and accessibility basics.

## Data model

See full schema in `lib/db/schema.ts`.

- buyers: `id, fullName, email, phone, city, propertyType, bhk, purpose, budgetMin, budgetMax, timeline, source, status, notes, tags, ownerId, createdAt, updatedAt`
- buyer_history: `id, buyerId, changedBy, changedAt, diff` (JSON)

Validation rules are implemented in `lib/validations/buyer.ts` and enforced both client- and server-side.

## What is implemented

- Auth: magic-link login and server callback via `@supabase/ssr`.
- Create lead (`/buyers/new`) with full Zod validation and history entry creation.
- List and search (`/buyers`): SSR pagination (10/page), URL-synced filters (city, propertyType, status, timeline), debounced search, sort by `updatedAt` desc.
- View & Edit (`/buyers/[id]`): edit form with `updatedAt` concurrency check and history (last 5).
- CSV import (`/buyers/import`): client-side parsing, per-row Zod validation, transactional insert via API, max 200 rows.
- CSV export of current filtered list.
- Dashboard (`/`): totals, status counts, 7-day updated trend, converted this week, new leads today. Layout fixes for overflow applied.
- Ownership enforcement: edits/deletes restricted to owner; read allowed to signed-in users.
- Rate limiting: simple in-memory token-bucket applied to create/update endpoints (`lib/rate-limit.ts`).
- Tests: Vitest unit tests for validation and several API integration tests.

## Design notes

- Validation: centralized in `lib/validations/buyer.ts` (Zod) and reused in forms and API routes.
- SSR vs client: listing and exports are server-rendered for correctness and performance; rich UI (tag chips, status dropdowns, bulk selection) are client components.
- Optimistic concurrency: updates include `expectedUpdatedAt` and `updateBuyer` checks timestamp differences with a small tolerance to avoid false conflicts.
- History: `buyer_history` stores diffs of changed fields and is written on successful updates.
- Rate limiting: in-memory implementation for dev; swap to Redis for production.

## Local setup

1. Copy example env: `cp .env.example .env.local` and fill values.
2. Install deps: `npm install`
3. Start dev server: `npm run dev`

Minimum env variables (in `.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://postgres:password@db-host:5432/postgres?sslmode=require
```

Notes:

- Add `http://localhost:3000/auth/callback` (and optionally `http://127.0.0.1:3000/auth/callback`) to Supabase Redirect URLs for development. Keep the Site URL set to your production domain.

## Migrations

- Edit `lib/db/schema.ts` for schema changes.
- Generate a migration: `npm run db:generate`
- Apply to DB: `npm run db:push`

Make sure `.env.local` contains a valid `DATABASE_URL` before running Drizzle CLI.

## Tests

- Run unit/integration tests: `npm test` (Vitest). There are tests for Zod validators and API routes.

## What's done vs skipped

- Done: core CRUD, SSR list with filters/search, CSV import/export (transactional), optimistic concurrency and history, Zod validation, migrations, tests, dashboard, rate limiting, basic accessibility.
- Skipped / optional: admin role UI, file attachment upload, advanced full-text index (basic ILIKE search implemented).

## Deployment checklist (Vercel + Supabase)

1. Create a Vercel project and import this repository.
2. Add environment variables in Vercel (same as `.env.local`).
3. In Supabase → Authentication → URL Configuration: ensure production and development callback URLs are added (e.g. `https://your-app.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`).
4. Run migrations against the Supabase DB before first production deploy:

```
npm run db:generate
npm run db:push
```

5. Deploy and verify login, create/edit, CSV import/export, and dashboard.

If you want, I can add a short release checklist and recommended Postgres indexes or a minimal `vercel` section for preview settings.
