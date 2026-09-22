# NagarGo API Reference

Base URL: `/api`

## Public
- `GET /health`
- `GET /cities`
- `GET /payments/config`
- `POST /auth/request-otp`
- `POST /auth/verify-otp`
- `POST /riders/register`

## Customer (Bearer JWT)
- `POST /orders`
- `GET /orders/:id`
- `POST /orders/:id/cancel`
- `POST /orders/:id/otp/:stage/request`
- `POST /orders/:id/otp/:stage/verify` (rider)
- `POST /payments`
- `POST /payments/:id/submit-transaction`
- `POST /medicine-orders`
- `GET /medicine-orders/:id`
- `GET/POST /addresses`
- `DELETE /addresses/:id`
- `POST /orders/:id/rating`
- `POST /orders/:id/dispute`
- `GET /referral`

## Rider
- `GET /riders/me`
- `GET /riders/orders`
- `POST /riders/online`

## Admin
- `POST /admin/auth/login`
- `POST /admin/auth/change-pin`
- `POST /admin/auth/logout-all`
- `GET /admin/dashboard`
- `GET /admin/riders`
- `POST /admin/riders/:id/review`
- `GET /admin/orders`
- `GET /admin/payments`
- `POST /admin/payments/:id/verify`
- `GET /admin/users`
- `POST /admin/users/:id/status`
- `GET/PUT /admin/pricing`
- `PUT /admin/payment-config`
- `GET/PUT /admin/content`
- `GET/PUT /admin/flags`
- `GET /admin/medicine-orders`
- `POST /admin/medicine-orders/:id/review`
- `GET /admin/audit-logs`
