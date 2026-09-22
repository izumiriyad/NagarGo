# Phase status

_Kept honest on purpose: this file should always describe what's
actually wired up, not what's planned. If a claim below turns out
stale, fix the claim, not the reader's expectations._

## Phase 1 — COMPLETE
Foundation, security (hashed admin PIN + lockout, JWT sessions, rate
limiting, audit log), server-side pricing, order state machine,
payment recording (COD / Pay-to-Rider / Pay-to-Admin), Telegram ops
notifications, Socket.IO transport, landing page/PWA shell.

## Phase 2 — COMPLETE
- Admin Panel: real tabbed UI (Dashboard, Riders, Orders, Payments,
  Medicine, Disputes, Users, Pricing, CMS, Flags, Audit) — no longer
  a raw JSON dump.
- Rider registration with real NID document upload (local-disk dev
  storage adapter; see `apps/api/src/services/storageService.ts` for
  the production swap point) and admin approve/reject/suspend.
- Rider dashboard: online toggle, live "new assignment" push via
  Socket.IO, accept/decline, OTP verification at pickup/delivery,
  stage advance.
- Order dispatch system: a background sweep
  (`dispatchScheduler.ts`) auto-assigns waiting orders every 15s, in
  addition to the admin manual-dispatch endpoint.
- Medicine Express: prescription upload, admin review, and
  auto-assignment to a medicine-eligible rider on approval.
- A real order-creation UI (`/book`) with Google Places Autocomplete
  and an animated route preview — this page didn't exist before and
  was a hard blocker for the customer flow.
- Bangla/English i18n: full dictionary + persisted switcher, applied
  across nav, rider, medicine, checkout, and admin surfaces.
- Password-based signup/login (name/phone/email/username + password)
  alongside the original phone-OTP flow.

## Phase 3 — COMPLETE
- Ratings: customer rates a delivered order once; rider's rolling
  average updates; rider is notified.
- Disputes: a real `Dispute` model (category, status, resolution)
  with an admin resolve workflow, replacing the earlier
  "just tag the order" approach.
- In-app notifications: persisted `Notification` model + real-time
  Socket.IO push, covering order assignment, payment verify/reject,
  rider approve/reject, medicine approve/reject, dispute resolution,
  and ratings received.
- Production hardening carried over from Phase 1 (rate limiting on
  every sensitive endpoint, Mongo duplicate-key errors surfaced as
  clean 409s instead of raw driver errors, graceful fallback if the
  Google Maps API call fails rather than breaking order creation).

## Phase 4 — PARTIALLY WIRED, NEEDS YOUR CREDENTIALS
- Google Maps: **wired and working** for Places Autocomplete, route
  preview, live rider tracking, and server-side Distance Matrix
  pricing — needs a Maps key with Places + Distance Matrix + Maps
  JavaScript APIs enabled and HTTP-referrer restrictions set.
- Real payment gateways (bKash/Nagad live API), push notifications
  (FCM/APNs), and analytics dashboards are **not implemented** —
  these need live merchant/provider credentials this build doesn't
  have, and the code deliberately does not fake them. The env vars
  and adapter seams are already in place (`.env.example`,
  `storageService.ts`, `mapService.ts`) so wiring in real
  credentials later is additive, not a rewrite.

## Phase 5 — PLANNED SCALE
Multi-city zones, advanced geospatial dispatch, scheduled/batched
delivery, loyalty, deeper analytics, customer support/SLA tooling.

## Data storage note
This build's persistence layer is MongoDB throughout — every model,
query, and transactional guarantee (duplicate-payment prevention,
the order state machine, audit logging) is written against it, and
nothing in the codebase deletes records except explicit admin
actions. Migrating to Supabase/Postgres would mean rewriting the
entire data layer; that has not been done here so as not to risk the
working system without an explicit decision to do so.
