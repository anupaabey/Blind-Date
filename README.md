# Blind Date Club · Sri Lanka

A Next.js App Router / TypeScript application with a premium responsive public site, Supabase Auth, PostgreSQL, private Storage, human-reviewed matching, independent invitations, date coordination, payment verification and private feedback. The brand name is provisional; edit the public copy and metadata in `src/app/layout.tsx`, `src/app/page.tsx`, and shared header/footer components.

**For adults currently residing in Sri Lanka.** Residency is not nationality or ethnicity. All 25 districts are supported for registration; only Colombo is active for bookings. Other districts enter a Sri Lanka-only waitlist. Accounts remain accessible while traveling; no IP-based residence decisions are made.

## Run locally

Prerequisites: Node 24 (see `.nvmrc`), npm, Docker daemon, 8 GB free disk space for the lightweight stack and normal package/build caches. Docker must be available to your shell. Use the existing checkout; each cloud task is already isolated, so no extra Git worktree is needed.

```bash
npm ci
npm run local:setup
npm run dev
```

`local:setup` starts actual PostgreSQL 17, official Supabase GoTrue Auth, PostgREST, Supabase Storage, and a local SMTP capture service in Docker, applies all migrations, and starts a loopback-only API gateway. It generates random development credentials in ignored `.local/` and `.env.local` files, without printing them or overwriting an existing environment file. This lean stack avoids the very large Supabase development Postgres image on cloud Docker hosts that use the VFS storage driver. It is **for local development only**, not a production hosting stack.

The app runs on port 3000. The API uses 54321; Postgres 54322; captured local emails 54324; Auth 54325; REST 54326; Storage 54327. Docker published ports and the API gateway bind to loopback. Real external email/SMS and payments are not sent by this stack. Local signup and password-reset emails are captured in Mailpit on port 54324. Verify the email link before signing in.

After a restart, run `npm run local:start` followed by `npm run dev`. Files and Docker volumes persist independently of running processes. `npm run db:migrate` applies only previously unapplied migrations. The local scripts are repeatable and never reset user data. They do not silently rewrite existing container configuration: if you intentionally change generated local configuration, stop and recreate only the named `bdc-*` containers after preserving any necessary data.

For the standard full Supabase CLI stack on your own machine, use `npm run db:start` and `npm run db:reset`, then securely copy its URL, anon key and service-role key into `.env.local`. **`db:reset` is destructive; use only on disposable development databases.** Do not run the full CLI stack and the lightweight stack at the same time because their default ports overlap. On hosts where public ECR is blocked, the CLI supports `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io`.

## Explore fictional demo data

```bash
npm run demo:seed
```

This creates six fictional Sri Lankan profiles, actual questionnaire answers, two explicitly fictional demo-only Colombo venues and matching suggestions. An admin must still review recommendations and both members must still accept. The local-only login details are stored in ignored `.local/demo-accounts.json`, with restrictive file permissions. Do not paste them into issues or commit them. Demo accounts show a conspicuous banner, cannot pair with real accounts, cannot book real venues, and are excluded from notification emails and real member totals. Demo seeding refuses a non-local project and preserves previously generated credentials.

To grant a real administrator, first register and verify an account, then, as the project owner:

```bash
npm run admin:create -- verified-account@example.com
```

The script uses the server-only service role key and records an audit event. A member cannot grant themselves this role. Sign in normally and visit `/admin`.

## The complete MVP journey

1. Register with a Sri Lankan town, +94 mobile number, adult date of birth, residency declaration and terms/privacy consent. Confirm the Auth email. Optional phone OTP uses your Supabase project's configured SMS provider.
2. Complete the four-step profile/preferences form and all 24 compatibility questions. Anonymous sharing choices default to off.
3. An administrator reviews current Sri Lankan residency and records the method without retaining identity documents. Email must already be verified. A phone number or IP address alone is not proof. Outside-Colombo members remain waitlisted.
4. Admin generates suggestions or creates a manual recommendation. Both paths apply the same mutual eligibility rules. Admin approves a suggestion and chooses a 1–168 hour invitation window (72 by default).
5. Each person sees only the other person's expressly consented anonymous highlights. Both independently accept before booking becomes available. Declines and expired invitations cannot be accepted.
6. A member requests a package, available vetted public Sri Lankan venue and time, at least 24 hours and at most 90 days ahead. Booking times use Asia/Colombo, 08:00–21:59. Only admin can confirm an actual venue reservation.
7. PayHere checkout is available only with merchant configuration. Packages use LKR exclusively; food/drinks/venue costs are additional. No successful payment is fabricated in unconfigured or sandbox mode. Server-signed checkout and verified callbacks determine receipts, never the browser return URL.
8. After admin marks a past, confirmed booking completed, private feedback becomes available. Both members must feel safe, want another date and independently consent before first names and account emails can be exchanged. Reports and blocks exclude future matches; private rejection and feedback are not disclosed.

Each member maintains their own booking and payment for a mutually accepted invitation; admin coordinates the pair's shared venue/time before confirming either reservation. This is coordination, not a real-time venue inventory or reservation-provider integration.

## Validation

```bash
npm run typecheck
npm test
npm run test:db
npm run test:e2e
npm run build
```

`test:db` exercises actual Auth, PostgREST RPCs, RLS and Storage against the isolated local stack. It rejects non-local targets unless `ALLOW_REMOTE_DB_TESTS=yes` is explicitly set. It creates temporary fixtures and tests direct foreign/minor registration, member/admin authorization, residency review, mutual preferences, anonymous sharing, two-person acceptance, vetted venue booking, payment amount/currency/callback authorization, feedback, contact consent, reports and suspension.

Chromium end-to-end tests run public routes, mobile layout/navigation, dark mode, registration/email confirmation and the multi-user/admin workflow. The npm-distributed Chromium binary is used so browser installation does not depend on a separate download host. Test artifacts and traces are ignored; traces may contain sensitive test-session data and must never be published as production logs. Local tests advance a fictional booking time explicitly to exercise feedback; no actual date or reservation is claimed.

## Architecture and deployment

- `src/app/`: public routes, Auth callbacks, authenticated dashboards, booking, checkout and server actions.
- `src/components/`: responsive design, accessible forms, shadcn-style Radix/CVA button, questionnaire and shared site elements.
- `src/lib/`: validation, Sri Lankan locations, questions, reference scoring, server-only Supabase clients and payment signing.
- `supabase/migrations/`: tables, constraints, RLS, authorized workflow functions and reference data. SQL RPCs are the authoritative eligibility and scoring implementation.
- `scripts/`: repeatable local setup, migration runner, isolated integration tests, demo seeding and owner-run admin provisioning.
- [Deployment guide](docs/DEPLOYMENT.md), [security model](docs/SECURITY.md), [production checklist](docs/PRODUCTION_CHECKLIST.md).

The interface is English-first. Locale/currency/time utilities are centralized; the Sri Lankan province/district/town allowlist is separate from presentation. Sinhala/Tamil translations and language routing are not shipped yet. Town coordinates are approximate centres for straight-line preference checks, never exact residences. The allowlist is deliberately curated; missing towns require review before addition.

**Current integration boundaries:** hosted Supabase and Vercel deployment, real merchant callbacks/refunds, outbound email, SMS delivery, real residency reviews and genuine venue partnerships require your own configured services and operational review. Legal pages are marked drafts requiring Sri Lankan professional legal review. No live deployment or successful real-world integration is implied by local tests.
