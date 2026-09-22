# NagarGo — Complete Build Roadmap

The project now includes the Phase 1 foundation plus the Phase 2 and Phase 3 application surfaces. Integrations that require third-party credentials remain explicit adapters/configuration points; no fake production gateway is claimed.

## Phase 1 — Foundation
- Monorepo, Docker, validated environment configuration
- MongoDB/Mongoose models and indexes
- OTP/JWT/RBAC/security controls
- Server-side pricing and legal order state machine
- Payment methods: COD/Live, Pay-to-Rider, Pay-to-Admin
- Transaction-ID duplicate and amount-mismatch anti-fraud checks
- Telegram notifications, Socket.IO, audit logging
- Customer-facing landing page and PWA/offline shell

## Phase 2 — Operations and core product
- Rider registration with NID/document URL, vehicle and bKash payout details
- Admin dashboard and queues for riders/payments/orders/users
- Rider approval/rejection/suspension
- Pricing and payment configuration endpoints
- Content CMS and feature flags
- Medicine Express order submission and admin review
- Rider profile, online/offline state and delivery list
- Saved addresses and referral code
- Basic Bangla/English message dictionaries

## Phase 3 — Trust, growth, documentation and hardening
- Ratings with rider rating aggregation
- Customer disputes and audit trail
- Legal page templates: Terms, Privacy, Prohibited Items, Medicine, Refunds
- OpenAPI-style API reference in `docs/API.md`
- Expanded tests for state transitions, hashing and payment fraud cases
- Production hardening checklist

## Phase 4 — Production integration backlog
- Real SMS/WhatsApp OTP provider
- Google Maps road distance/geocoding with restricted API key
- Secure object storage + signed upload URLs for NID/prescriptions/receipts
- Real bKash/Nagad/payment gateway adapters and webhook verification
- Background job queue for matching, notifications and reconciliation
- Push notifications
- Observability, metrics, alerting, backups, disaster recovery
- Security review, penetration testing, privacy/legal review
- App Store/Play Store React Native or native clients

## Phase 5 — Scale
- Multi-city zones and city-specific pricing
- Advanced rider matching and dispatch optimization
- Scheduled delivery, batching and route optimization
- Loyalty/referrals/rewards
- Analytics warehouse and operational reporting
- Customer support tooling and SLA workflows
