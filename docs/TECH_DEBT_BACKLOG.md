# Technical Debt & Backlog

## TypeScript / `any` Cleanup (P2)
- [ ] **AdminPanel**: Cleanup `catch (error: any)` blocks and `as any` usages in form events.
- [ ] **propertyService**: Refactor `catch(e:any)` to type-safe error handling.
- [ ] **campaign90Template**: Remove `as any as CampaignDayTemplate[]` casts.
- [ ] **main.tsx**: Type overrides for `console.error` and `console.warn` interceptors.

## Architectural (P2/P3)
- [ ] **server/ai-api.ts**: Split into smaller feature-scoped routes in the future to reduce monolith API file size.
- [ ] **App.tsx Component Weight**: Extract `onboarding` and `campaign` flow logics into dedicated hooks or context providers.
- [ ] **View Extractions**: Deeper component extraction for `DashboardView`, `BolgemView`, and `ProfilView` to improve maintainability.

## Testing & Quality (P2)
- [ ] **Playwright E2E**: Setup full end-to-end tests for core flows (signup, gamification, AI usage).
- [ ] **Supabase Local RLS**: Implement local DB tests for RLS policies to prevent regression.
- [ ] **npm audit follow-up**: Evaluate updating `express-rate-limit` to resolve moderate XSS vulnerability in `ip-address` dependency.
