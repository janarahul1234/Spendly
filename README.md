# Spendly — minimalist expense tracker

A modern, minimalist SaaS-style expense tracker: log income and expenses, watch a
month take shape, set savings goals, cap categories with budgets, and read the trends.

Built with **Next.js (App Router) · React · Tailwind CSS v4 · shadcn/ui · Supabase**.

---

## Features

| Area | What you get |
| --- | --- |
| **Home** | Total balance, income, expenses, savings, average daily spend, spending distribution bar, recent transactions, month/year selector, search + type + category filters |
| **Transactions** | Add / edit / delete income & expenses with amount, date, category, payment method and note; search, filters, group-by-date, category pills, income/expense indicators, CSV export |
| **Goals** | Multiple goals with target amount, saved amount, target date and progress bar; add money or withdraw; edit and delete |
| **Finance** | Income and expense summary, overall monthly budget, per-category budgets, spent vs remaining, safe-to-spend-per-day |
| **Reports** | Income vs expenses, monthly spending trend, category breakdown (donut + bars), savings trend, month-by-month table, 6/12-month range |
| **Account** | Unified Google sign-in / sign-up via Supabase Auth, light/dark/system theme, notifications & reminders, settings, CSV + JSON export |

Every screen ships with loading, empty and error states, and the layout is
mobile-first (slide-in navigation below `md`).

---

## Quick start

```bash
npm install
npm run dev
```

Spendly stores everything in Supabase, so create a project first:

### Connect Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run [`supabase/schema.sql`](supabase/schema.sql)
   (creates `profiles`, `transactions`, `goals`, `budgets`, `notifications`, row-level
   security policies, and a trigger that provisions a profile on signup).
3. In **Authentication → Providers**, enable **Google** and paste the **Redirect
   URI** Supabase shows you (`https://<project>.supabase.co/auth/v1/callback`) into
   **Authorized redirect URIs** in Google Cloud Console, alongside
   `http://localhost:3000` under **Authorized JavaScript origins**.
4. In **Authentication → URL Configuration**, set the URLs that Supabase is allowed
   to return the browser to. Anything not listed here is silently replaced by the
   **Site URL**, which is the usual cause of "sign-in never comes back to
   localhost":

   - **Site URL**: `http://localhost:3000` while developing, your deployed origin
     (`https://spendly-sigma-three.vercel.app`) once live.
   - **Redirect URLs**: add every callback you use, e.g.
     `http://localhost:3000/signin/callback`, `http://127.0.0.1:3000/signin/callback`,
     `https://<production-host>/signin/callback`, and for Vercel previews
     `https://*-<account-slug>.vercel.app/**`.

   Keep the dev server on port **3000**: the PKCE code verifier is stored per
   origin, so starting on `:3000` and landing on `:3001` fails the exchange.
5. Copy `.env.example` to `.env.local` and fill in:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
   # Leave empty locally; only set it for deployments (see .env.example).
   NEXT_PUBLIC_APP_URL=
   ```

6. Restart `npm run dev`. Open <http://localhost:3000>, sign in (or up) with Google,
   and use **Restore sample data** on the Profile page to seed ~15 months of
   realistic transactions into your database.

The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` variable is still accepted if you have
not rotated to the new publishable key pair yet.

### Where sign-in redirects come from

`src/services/supabase/utils/app-url.ts` resolves the OAuth `redirectTo` (`/signin/callback`) in this
order: a loopback browser origin, then `NEXT_PUBLIC_APP_URL`, then the live
browser origin, then `http://localhost:3000` for server renders. Local development
therefore always returns to the port you started on, even if `NEXT_PUBLIC_APP_URL`
is stale, while a deployment gets a fixed canonical origin. Set
`NEXT_PUBLIC_APP_URL=https://<production-host>` in Vercel's environment variables
(build-time, since `NEXT_PUBLIC_*` values are inlined) and leave it unset locally.

### Scripts

```bash
npm run dev      # start the dev server (Turbopack)
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
npx tsc --noEmit # type check
node scripts/contrast.mjs  # WCAG ratios for the accent tokens + their chart hexes
```

---

## Project structure

```
src/
  app/
    (dashboard)/          # authenticated shell: header + footer + providers
      page.tsx            # Home dashboard
      transactions/       # list, filters, CRUD
      goals/              # savings goals
      finance/            # budgets
      reports/            # charts
      profile/            # account, settings, data tools
    (auth)/
      signin/             # unified Google sign-in / sign-up page
      signin/callback/    # OAuth landing page
    favicon.svg, error.tsx, not-found.tsx, globals.css, layout.tsx
  components/
    ui/                   # shadcn/ui primitives
    dashboard/            # header, nav, month selector, shared states, user menu
      transactions/       # transaction rows, list, filters, form dialog, stat cards
      goals/              # goal card, goal form, add-funds dialog
      finance/            # budget dialog
      reports/            # recharts wrappers
  hooks/use-month-filter.ts
  lib/
    utils.ts              # cn helper
  services/
    supabase/
      client.ts           # singleton browser client + configuration check
      actions/            # per-table DB operations (transactions, goals, budgets,
                          # notifications, settings) + shared client/query helpers
      contexts/
        auth-provider.tsx # session + Google OAuth via Supabase
        data-provider.tsx # loads data, optimistic CRUD, persistence
      data/
        categories.ts     # curated categories, payment methods, palette
        goal-colors.ts    # goal accent tokens
        persistence.ts    # DataPersistence facade composing the actions (load/seed/clear)
        reminders.ts      # generated notifications
        sample.ts         # deterministic seed data
      migration/          # schema migration notes
      types/              # domain types, one file per entity
        app-data.ts       # AppData aggregate loaded per user
        budget.ts         # Budget
        goal.ts           # Goal, GoalColor, GoalDraft
        notification.ts   # AppNotification, NotificationTone
        settings.ts       # Settings, CurrencyCode
        transaction.ts    # Transaction, TransactionType, PaymentMethod, TransactionDraft
      utils/
        analytics.ts      # totals, breakdowns, trends, budget usage
        app-url.ts        # OAuth redirect origin resolution
        export.ts         # CSV + JSON download helpers
        format.ts         # currency/date/percent formatting
        id.ts             # id generator
        nav.ts            # navigation items
supabase/schema.sql
```

### How the pieces fit

- **`DataPersistence`** is a single interface (`load`, `saveTransaction`, `deleteGoal`, …)
  implemented against Postgres through Supabase, with camelCase ↔ snake_case row
  mapping and one active code path.
- **`DataProvider`** holds all app data in memory, applies mutations optimistically,
  persists through the facade, and rolls back with a toast if a write fails.
- **Reminders** are derived, not scheduled: on load the app compares goals, budgets
  and today's activity and inserts any missing notifications (deduplicated per day,
  respecting the toggles in Settings).

---

## Design notes

- Warm-gray background, near-black type, hairline borders, soft `rounded-xl` corners,
  minimal shadows — no gradients, no glassmorphism.
- Restrained accents mapped to meaning: `income` green, `expense` red, `savings`
  yellow, `goal` purple. They live as CSS custom properties in
  `src/app/globals.css` (`--income`, `--expense`, …) and are exposed to Tailwind as
  `text-income`, `bg-expense/10`, etc. Every token clears WCAG AA (4.5:1) on both
  the page and card surfaces in light mode — `scripts/contrast.mjs` recomputes the
  ratios and prints the matching hexes whenever a token changes.
- 8px spacing rhythm (`gap-2`, `p-4`, `gap-4`, `gap-6/8`), 150–250ms transitions on
  anything interactive.
- Geist Sans for UI, Geist Mono for tabular figures (`.tabular` enables
  `font-variant-numeric: tabular-nums` so amounts line up in columns).
- Charts read colors from JS tokens rather than CSS variables because SVG
  presentation attributes cannot resolve `var()`.

---

## Scope

Deliberately an MVP: no bank feeds, investments, SIPs, loans, invoices or double-entry
accounting. Categories are curated rather than user-defined, and amounts are stored as
positive numbers with an `income` / `expense` type — simple to reason about and easy to
query.
