# KairosGames on Kharis Supabase

Project: `yrqkafiqwllkphroztqk` (Kharis, London). The project was restored with the user's authorization. The existing Kharis application's public schema, Auth users, functions and assets were preserved.

## Data and authentication

The private `kairos_games` schema contains `family_accounts`, `family_children`, `family_sessions`, `learning_results`, and `family_auth_limits`. All five tables enable RLS. PUBLIC, `anon` and `authenticated` have no schema or table access. No browser Data API policy is intentional: password hashes and session hashes must never be reachable through the Data API. The trusted Edge Function uses `SUPABASE_DB_URL`, supplied by Supabase at runtime, and performs the existing password and scoped-session authorization before querying. Family accounts use the site's existing authentication system; Kharis Supabase Auth users are separate.

The site's server relays same-origin `/api/family` requests to `kairos-family`. It forwards only the family cookie, rejects foreign-origin writes and redirects, and extracts the family cookie independently of Supabase gateway cookies. No secret/service-role key or database password is present in public files or the Worker. A bounded Postgres connection pool is reused per function isolate. Queries bind values and explicitly qualify the private schema.

Known allowed origins are localhost/127.0.0.1 on port 4173 and the original Kairos hosted origin. Add other exact origins with the Edge Function's comma-separated `KAIROS_ALLOWED_ORIGINS` secret before deploying another frontend hostname. Public clients still need a password or child-scoped session; the origin allowlist does not replace authentication. Email verification and password recovery are not implemented by this database connection.

## Deployment

`config.toml` records the project and function. `verify_jwt = false` is intentional because the function performs its own family authentication, including unauthenticated signup/login. This does not disable its application authorization.

The migration was created with Supabase CLI 2.122.0 and applied to the remote project via the connected Supabase tool. Function dependencies pin Postgres.js to 3.4.9. The function entrypoint imports shared service modules outside the function directory; include all relative dependencies when deploying. Changes to `public/bible/content.mjs` also require `public/bible/extra-content.mjs` in that source bundle. Deploying the Edge Function updates the live backend. Rebuild and deploy the Worker/frontend separately to publish local shell changes.

Set the Worker variable `FAMILY_BACKEND=d1` only when deliberately testing the older D1 implementation. Supabase failures never silently fall back to a separate D1 account store. Existing device profiles stay on the device. Local D1 contained only generated browser-test families at cutover, so no real family accounts required migration. Test families created during cloud validation are removed from this schema after checks.

## Verification

`npm test`, `npm run build`, and `node tests/family-browser.mjs`. The browser flow uses the real Supabase-backed API and covers signup, child profiles, offline/reload retry, cross-browser parent progress, sibling isolation, locked parent access, logout, and denied localStorage. Do not log passwords, cookies, connection strings or session tokens.

Supabase advisors were checked. New-table “RLS enabled, no policy” notices describe the intentional server-only deny-by-default access model ([advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)). Existing Kharis notices about its older public functions and Auth settings remain outside this change; review them in the [project Security Advisor](https://supabase.com/dashboard/project/yrqkafiqwllkphroztqk/advisors/security). The new schema has indexes covering its foreign keys and the per-child result/date lookups.
