# Portfy

Portfy is a real estate AI CRM application.

## Production Verification

For production Database validation, especially regarding admin tables correctly created, check via SQL Editor:
```sql
select to_regclass('public.package_requests');
select to_regclass('public.ai_request_logs');
select to_regclass('public.runtime_error_logs');
```
If `package_requests` is null, you must run migration `50`. If `runtime_error_logs` is null, run migration `51`.
Always add `NOTIFY pgrst, 'reload schema';` at the end of new schema changes to instruct PostgREST cache flushes.

To verify the project is ready for production, run:
```sh
npm ci
npm run lint
npm run test:smoke
npm run build
```

**Vercel Deployment:** The build outputs static client files into `dist/` and runs the backend using the Vercel Serverless Functions configuration located in `api/index.ts` alongside `vercel.json` rewrite rules.

## Schema & Migration Standard

Our canonical database standard strictly enforces:
- `profiles` Primary Key is `id`
- All foreign keys resolving to `profiles` are named `user_id`

The SQL migration chain is additive and handles fresh installs and upgrades gracefully:
1. `01_schema.sql` - Establishes the fresh canonical schema and generic parity structure.
2. `02_security.sql` - Sets up all initial Row-Level Security parameters.
3. `03_initial_data.sql` / `03_subscription_safety.sql` - Sub requirements & defaults.
4. `04_xp_safety.sql` - Prevents duplicated XP rewards.
5. `05_cleanup.sql` - Empty deprecated legacy hook.
6. `06_missing_tables.sql` - Supplemental parity hook.
7. `07_final_normalization.sql` - Safely targets and merges legacy variants (like `uid`, `agent_id`, `userId`) down to `user_id` without destructive dataloss.

## Production Hardening Status

**Completed Hardening Steps:**
- Implemented Production error safety and nested recursive log masking for API responses.
- Active route-level lazy loading and `manualChunks` optimization to improve bundle size.
- Standardized `admin`/`super_admin` logic using Single Source of Truth helper.
- Consolidated subscription/token logic into `shared/subscriptionRules.ts`.
- Implemented Atomic XP updates (`START_DAY`, `END_DAY`) avoiding client-spoofed payload issues.
- Introduced Sensitive contact data masking utility.
- Generic AI proxy protected against arbitrary client `systemInstruction` injections and enforces token limits.
- Established Vitest smoke suites for application core features.

**Required Env Vars:**
Ensure variables defined in `.env.example` are present in your production environment (e.g. Supabase keys, Gemini keys, Service role, Node Env constraints).

**Commands for Audit:**
```sh
npm ci
npm run lint
npm run test:smoke
npm run build
npm audit --omit=dev
```
