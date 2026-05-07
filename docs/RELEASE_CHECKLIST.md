# Release Checklist

## Pre-release Manual Checklist
- [ ] **User RLS Test**: Verify User A cannot access or modify User B's data.
- [ ] **AI Endpoint Test**: Check AI token limits, rate-limit middleware, and ensure `systemInstruction`/`responseSchema` overrides from client are rejected.
- [ ] **XP & Gamification Test**: Trigger a `START_DAY` and `END_DAY` event; ensure XP is awarded via atomic RPC, not client spoofed amounts.
- [ ] **Subscription Gate Test**: Verify access levels for `free`, `trial`, `pro`, `master`, `elite`. Verify `admin`/`super_admin` bypass limitations gracefully.
- [ ] **Mobile Performance Test**: Load the app on a simulated Slow 3G network and verify lazy-loaded chunks function properly.
- [ ] **Public Presentation Test**: Review public portfolio links to ensure no sensitive contacts (phone, email) are leaked in `select('*')` responses.
- [ ] **Admin/Super Admin Test**: Verify the `admin_view` and `admin_settings` functions work securely. Validate Migration 44 impact.

## Useful Debug Queries

### Token Usage Tracking
```sql
select
  feature_key,
  model_name,
  count(*) as request_count,
  sum(total_tokens) as total_tokens,
  max(created_at) as last_used_at
from public.ai_request_logs
where user_id = 'USER_ID'
group by feature_key, model_name
order by total_tokens desc;
```