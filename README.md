# Portfy

Portfy is a real estate AI CRM application.

## Production Verification

To verify the project is ready for production, run:
```sh
npm ci
npm run lint
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
