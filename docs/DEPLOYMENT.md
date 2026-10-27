# Deploy with Supabase, GitHub and Vercel

## Deploy the public site now

Open [Vercel New Project](https://vercel.com/new), sign in, and import `anupaabey/Blind-Date` from GitHub. Use the Next.js preset, the repository root, Node 24, and the default `npm run build` command, then choose Deploy. The public site builds without external credentials; registration and account features remain explicitly unavailable until hosted Supabase is configured.

The `.vercelignore` excludes local environment files, generated development credentials, local database configuration files, and browser-session artifacts from CLI uploads. Never copy the local `.env.local` to Vercel. After adding hosted Supabase configuration and the final `SITE_URL` in the project's secure environment settings, redeploy so Next.js rebuilds its routes with the new configuration.

For an agent to deploy from this cloud workspace, allow `api.vercel.com` and `vercel.com` in environment networking and supply Vercel access securely through the environment settings or the official CLI login flow. Never paste a Vercel token in chat. A CLI installation or a successful local build does not create a hosted deployment.

## Connect the production services

1. Create a **separate production Supabase project**. Never copy the local Docker JWT secret, fake profiles or generated development credentials into it. Review migrations and apply them in filename order using the SQL editor or Supabase CLI (`supabase link` / `supabase db push`) with your own authenticated project access. Do not run local demo seeding against it.
2. Enable Auth email confirmations, require passwords of at least 12 characters, disable anonymous sign-ins, configure production SMTP with sender-domain authentication and appropriate rate limits/CAPTCHA. Set the Auth site URL to the production HTTPS origin and allow the exact `/auth/callback` recovery and signup redirects. Use Supabase Auth's PKCE confirmation link or configure an email template using `/auth/callback?token_hash={{ .TokenHash }}&type=email`. Set appropriate session and security policies. Optional phone OTP requires a supported SMS provider connected through Supabase Auth; no fake verification fallback exists.
3. Import the repository into Vercel as a Next.js project on Node 24. Set environment values securely in Vercel, using `.env.example` as the list of names. Only the project URL and **anon/publishable** API key may be `NEXT_PUBLIC_*`. `SUPABASE_SERVICE_ROLE_KEY` is a server-only Supabase service-role JWT, needed for account deletion, contact intake, notification delivery and payment callbacks. Never use a privileged key as the public anon key. Set `SITE_URL` to the canonical HTTPS origin; it is used for trusted Auth and payment redirects.
4. For PayHere, obtain merchant approval for the actual dating/coordination business and current supported merchant terms. Confirm the currently documented hosted checkout and callback protocol with PayHere before live use. Set `PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET` and `PAYHERE_MODE=sandbox`. Configure the public HTTPS callback `/api/payments/payhere`. Signed fields follow PayHere's merchant/order/amount/currency/secret hash protocol. Verify sandbox success, failure, cancellation, duplicate notification, incorrect amounts/currencies and refund processing against the actual provider. A localhost callback is not reachable by PayHere. Only change to `live` after approval and the production checklist. The browser return URL never confirms payment. Chargebacks currently require explicit operator handling (the endpoint refuses to silently mark them paid); establish reconciliation before accepting live money.
5. For transactional emails, configure `RESEND_API_KEY` and a verified `EMAIL_FROM`. Set a long random `CRON_SECRET`. The protected `/api/cron/notifications` endpoint queues upcoming-date reminders, atomically claims outbox jobs, sends through Resend using an idempotency key, and records successful delivery. Missing credentials return an explicit unconfigured state and leave notifications in-app. The included Vercel cron runs daily at 03:00 UTC / 08:30 Asia/Colombo; use an appropriate paid-plan schedule (for example every 15 minutes), monitor queue failures and retry exhausted jobs according to your operations policy. Auth confirmation/recovery emails are handled by Supabase rather than Resend. No real delivery was verified during local implementation.
6. Register and confirm the owner account. Run `npm run admin:create -- owner@example.com` from a trusted environment configured with that production project's server credentials. Do not create a public admin signup route or put admin credentials in a seed file. Consider requiring Supabase TOTP MFA for all administrators before launch; this MVP checks role and session but does not enforce admin MFA itself.
7. Add real vetted public Colombo venues in the admin panel only after agreeing reservations and additional costs. Fictional demo venues must never be used for actual bookings. Country, district and city are constrained by the database. To expand coverage, an owner must review logistics and activate the relevant `districts.active` flag, migrate eligible waitlisted applicants after a fresh review, and add vetted venues. Location and booking screens currently intentionally offer Colombo bookings; expand the booking selector and coverage query in a separate reviewed change when operations are ready.
8. Connect a domain (a `.lk` domain is optional), enforce HTTPS, configure DNS/sender verification, run migration/RLS/security checks on a staging copy and then deploy. Nothing in this project pushes to GitHub, publishes Vercel, creates a merchant account or changes DNS automatically.

## Environment variables

| Name                                             | Scope / purpose                                         |
| ------------------------------------------------ | ------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                       | Public project HTTPS origin                             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                  | Public anonymous/publishable client key, subject to RLS |
| `SUPABASE_SERVICE_ROLE_KEY`                      | Server-only service-role JWT; never ship to a browser   |
| `SITE_URL`                                       | Canonical application origin, including scheme          |
| `PAYHERE_MODE`                                   | `sandbox` (test) or explicitly approved `live`          |
| `PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET` | Server-only merchant configuration                      |
| `RESEND_API_KEY`, `EMAIL_FROM`                   | Optional configured transactional mail transport        |
| `CRON_SECRET`                                    | Server-only scheduler authorization                     |

Store secret values in deployment/environment settings, never chat, source, screenshots or committed `.env` files. Supabase service-role credentials must be usable by the server for the configured HTTPS project destination; do not substitute an incompatible proxy placeholder in a local JWT decoder. Retain existing platform Git authentication.

Required production destinations are the actual `<project>.supabase.co`, `api.resend.com` when mail is enabled, `sandbox.payhere.lk` for sandbox checkout and `www.payhere.lk` for live checkout. Set exact project-specific network rules once the project hostname is known. Package installs use npm; local Docker setup uses Docker Hub and its standard image download endpoints. Do not replace unknown network allowlists or disable TLS/checksum verification.

## Reproducibility and service lifecycle

`npm ci` uses the committed lockfile. `npm run local:setup` is idempotent, preserving `.env.local`, generated configuration, data volumes and migration history. The local helper does not run in Vercel; Vercel connects directly to managed Supabase. Production migrations must be applied deliberately before deploying the application release. Never run `supabase db reset` on a production project.
