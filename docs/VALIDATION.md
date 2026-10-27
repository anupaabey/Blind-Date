# Local validation · 27 October 2026

Verified in this cloud workspace using Node 24.19, PostgreSQL 17, official Supabase Auth/Storage containers and PostgREST:

- Frozen dependency install (`npm ci`) completed.
- TypeScript validation completed.
- 10 domain tests passed (Sri Lankan locations/phones/adult dates, mutual preferences, weighted compatibility and PayHere signatures).
- 12 integration tests passed against the real local database, Auth, REST and private Storage services. They include direct eligibility bypass attempts, RLS, admin authorization, both decisions, verified payment state transitions, feedback consent, reporting/suspension, expiry, residence changes and matching opt-out.
- 3 Chromium end-to-end tests passed in development; the final optimized production build passed 4 Chromium tests, including secure account deletion. They cover public pages, desktop/mobile behavior, light/dark mode, registration and verification, and a multi-user/admin journey through questionnaire, recommendation, independent acceptance, booking coordination and private feedback.
- Production compilation completed, including all application routes.
- Local setup was rerun without resetting data or replacing configuration. Demo seeding was run twice and preserved the existing generated credentials on the second run.
- Anonymous catalog reads returned 25 Sri Lankan districts and three LKR packages. The public home/signup routes responded successfully; the notification scheduler rejected an unauthenticated request.
- The configured service-role credential was absent from generated browser assets.

Payment state tests used fictional sandbox records and the service-authorized database transition; they did not perform a real PayHere transaction or provider-to-server callback. Email confirmation tests verified the Auth token flow; local SMTP is captured, and no external email or SMS delivery is claimed. Dates and venue confirmations in tests are fictional fixtures, with explicit time advancement to exercise feedback. No production deployment, real residency review, merchant approval, real venue reservation, legal compliance determination or independent penetration test was performed.
