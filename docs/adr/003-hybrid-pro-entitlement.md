# ADR 003: Hybrid Pro Entitlement — RevenueCat + Supabase Household

**Date:** 2026-08-11
**Status:** Accepted — deferred from v1

## V1 deferral

The webhook integration, `sync-subscription-status` edge function, `households.subscription_status` field, and `is_pro()` RPC are **not implemented in v1**. Grocery list and household access are free. Recipe import continues to be gated by each user's own RevenueCat entitlement (unchanged from today). The gap: if a primary cancels their subscription, a household member can still import recipes until they are manually removed. This is acceptable for the initial rollout.

These components will be implemented as a follow-up once household sharing is live.

---

## Context

Braise Pro is currently gated entirely client-side via `useSubscription.ts`, which calls `Purchases.getCustomerInfo()` and checks `entitlements.active.pro`. This works for single-user subscriptions.

The household feature requires a secondary user to receive Pro access via the primary's subscription — without buying their own. This means entitlement must be resolvable server-side (for RLS policies) and must account for household membership, not just personal RevenueCat state.

Two approaches were considered:

**Option A — Client-only:** Client passes its own JWT + household membership and the server trusts the client's claim of being in an active-subscription household.
- Rejected: RLS can't call out to RevenueCat; policy would have to trust a client-supplied claim, which is insecure.

**Option B — Webhook → Supabase RPC (chosen):** RevenueCat fires a webhook on purchase/renewal/cancellation → edge function updates `households.subscription_status`. A Supabase RPC `is_pro(user_id)` resolves to true if the user has their own active entitlement OR is an active member of a household where `subscription_status = 'active'`.

## Decision

Use Option B:

1. **RevenueCat webhook** → new edge function `sync-subscription-status` → updates `households.subscription_status` (`active` | `grace_period` | `inactive`).
2. **`is_pro(user_id uuid) → boolean` Supabase RPC** used in:
   - RLS policies (recipe import gate)
   - Any other server-side access checks
3. **Client-side `useSubscription.ts`** is updated to also check household membership: it continues using `Purchases.getCustomerInfo()` for its own entitlement, but additionally queries whether the user is in an active-subscription household. This keeps the UI reactive to both.
4. **iOS App Group `isPro` write** (in `App.tsx`) must reflect the resolved value — own entitlement OR household — so the share extension gates correctly.

## Primary user and RLS

The `households.primary_user_id` is stored separately from `household_members`. To keep RLS policies uniform, the primary user gets an `active` row in `household_members` when the household is created (self-referential membership). This means all access checks — for RLS, `is_pro()`, and the grocery list — reduce to a single `household_members` query pattern.

## Cancellation and removal behavior

- **Subscription lapses:** `subscription_status` moves to `inactive`; member loses Pro at the same moment as the primary.
- **Manual removal:** `household_members` row deleted → member loses Pro immediately, independent of billing period. `is_pro()` falls back to member's own entitlement (if any).
- **No separate grace period logic** for the member — they follow `subscription_status` exactly.

## Consequences

- New webhook integration required (RevenueCat → Supabase edge function). This is a new external dependency.
- `is_pro()` RPC must be kept in sync with `household_members` status changes; stale `subscription_status` is the main failure mode (mitigated by RevenueCat's retry behavior on webhook delivery).
- The `delete-account` edge function must handle household cleanup: if the deleted user is the primary, delete the household (cascading to members); if a member, delete their `household_members` row.
