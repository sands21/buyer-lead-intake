### Buyer Lead Intake — Next.js + Supabase + Drizzle

Production-ready lead intake app with auth (magic link), buyers CRUD, CSV import/export, dashboard analytics, bulk actions, optimistic concurrency, and accessibility.

### Tech Stack

- **Framework**: Next.js App Router (React 18+), TypeScript, Tailwind CSS, Shadcn/ui, Lucide, Sonner
- **Data**: Supabase (Postgres, Auth), Drizzle ORM (`postgres` driver)
- **Validation/Forms**: Zod, React Hook Form
- **Testing**: Vitest

### Prerequisites

- Node 20+
- Supabase project (URL + keys)
- Postgres connection string for Supabase (for Drizzle)

### Environment Variables

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require
```

Notes:

- `DATABASE_URL` must be the Supabase connection string (not local). SSL required on Vercel.
- Drizzle CLI loads env from `.env.local` (configured in `drizzle.config.ts`).

### Install & Develop

```bash
npm install
npm run dev
```

Local routes:

- `/login`: Magic link login
- `/buyers`: Buyers table (filters, search, bulk delete)
- `/buyers/import`: CSV import (max 200 rows)
- `/`: Dashboard (totals, status breakdown, 7-day trend, recent activity)

### Database & Migrations

Schema lives in `lib/db/schema.ts`. Migrations output to `lib/db/migrations`.

Generate and apply after schema edits:

```bash
npm run db:generate
npm run db:push
```

Notes:

- This runs against the database specified by `DATABASE_URL`.
- Indexes: email, phone, owner_id, updated_at, and composite `(owner_id, updated_at)`.

### Testing

```bash
npm test
```

Tests include Zod schema and API routes. If linter warns in test mocks but tests pass, prefer to proceed.

### Deployment (Vercel)

1. Create Vercel project and import this repo.
2. Add the same env vars in Vercel Project Settings → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL` (Supabase connection string)
3. In Supabase → Authentication → URL Configuration:
   - Site URL: your Vercel domain (e.g., `https://your-app.vercel.app`)
   - Redirect URL: `https://your-app.vercel.app/auth/callback`
4. From local, ensure `.env.local` points to the same Supabase DB, then:

```bash
npm run db:generate
npm run db:push
```

5. Deploy. Verify:
   - Login via magic link
   - Create/update buyer (no 409 conflict on fresh refresh)
   - Filters, bulk delete, CSV import/export
   - Dashboard stats render without overflow

### Troubleshooting

- Auth loop: ensure Supabase Site/Redirect URLs match Vercel domain exactly.
- 409 on update: refresh detail page to get latest `updatedAt`, then retry.
- Drizzle env: if `DATABASE_URL` missing during generate/push, confirm `.env.local` and `dotenv` load in `drizzle.config.ts`.

### Scripts

- `dev`: Start dev server (Turbopack)
- `build`: Production build
- `db:generate`: Generate SQL migration from schema
- `db:push`: Apply migrations to database
- `test`: Run tests (Vitest)
