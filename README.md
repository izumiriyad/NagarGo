# NagarGo — Full Hosting, Deployment & Operations Guide

Welcome to the definitive deployment and usage guide for **NagarGo**, a production-ready hyperlocal delivery platform for Rajshahi, Bangladesh.

---

## 🏗 System Architecture

The project is a **Turborepo monorepo** with two apps:

| App | Stack | Port |
|---|---|---|
| `apps/api` | Node.js · Express · TypeScript · Mongoose · Redis · Socket.io · BullMQ | 4000 |
| `apps/web` | Next.js 14 · App Router · Tailwind CSS · PWA | 3000 |

---

## 💻 Local Development

### Prerequisites
1. **Node.js** v20+
2. **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier
3. **Redis** — local instance or [Upstash](https://upstash.com) free tier

### 1. Environment Variables

**`apps/api/.env`**
```env
NODE_ENV=development
PORT=4000
APP_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:4000

# Databases
MONGODB_URI=mongodb://localhost:27017/nagargo
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=                         # leave blank for local

# Auth secrets — use 64+ char random strings in production
JWT_SECRET=super_secret_jwt_key_change_me
JWT_REFRESH_SECRET=super_secret_refresh_key_change_me
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Admin bootstrap PIN (first-time admin login)
# Disable after first login: ADMIN_BOOTSTRAP_ENABLED=false
ADMIN_BOOTSTRAP_PIN=5555
ADMIN_BOOTSTRAP_ENABLED=true

# Cloudinary (profile photos, NID docs, prescriptions)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Maps (route calculation)
GOOGLE_MAPS_API_KEY=your_server_side_maps_key

# Telegram Bot alerts
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_admin_group_chat_id

# Rate limiting
OTP_RATE_LIMIT_WINDOW_MS=60000
OTP_RATE_LIMIT_MAX=5
```

**`apps/web/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_browser_facing_maps_key
```

> **Note:** Use a separate Google Maps key for the frontend (restrict it to your domain in the Google Cloud Console).

### 2. Install & Run

```bash
# From the monorepo root:
npm install
npm run dev
```

- **Web:** http://localhost:3000
- **API:** http://localhost:4000
- **API Docs (Swagger):** http://localhost:4000/api/docs
- **API Spec (JSON):** http://localhost:4000/api/docs.json

---

## 🚀 Production Deployment

Recommended stack:

| Layer | Service |
|---|---|
| Database | MongoDB Atlas (M0 free → M10 for production load) |
| Cache / Queue | Upstash Redis (Serverless) |
| Frontend | **Vercel** (optimal for Next.js) |
| Backend | **Render**, Railway, or DigitalOcean App Platform |
| File Storage | Cloudinary (free tier = 25 GB) |

### Backend (API) — Render / Railway

1. Connect your GitHub repo.
2. Set **Root Directory** → `apps/api`
3. **Build command:** `npm install && npm run build`
4. **Start command:** `npm run start`
5. Set all `.env` vars above in the platform's environment settings.
   - Set `NODE_ENV=production`
   - Set `APP_BASE_URL=https://nagargo.com`
   - Set `API_BASE_URL=https://api.nagargo.com`
   - Set `ADMIN_BOOTSTRAP_ENABLED=false` **after** the first admin login.

### Frontend (Web) — Vercel

1. Import repo into Vercel.
2. Vercel auto-detects Next.js + Turborepo.
3. Set environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.nagargo.com
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
   ```
4. Click **Deploy**.

---

## 🛠 Feature Workflows

### 1. First-Time Admin Bootstrap

On a fresh deployment there are no admin accounts:

1. Navigate to `/admin`
2. Enter the `ADMIN_BOOTSTRAP_PIN` (default: `5555`)
3. ⚠️ **Security:** Immediately go to Admin → Flags and set `ADMIN_BOOTSTRAP_ENABLED=false` in your `.env`, then redeploy.

### 2. Mandatory First Configuration (before taking orders)

In the Admin dashboard:

1. **Admin → Pricing:** Create at least one pricing config for your city ID (e.g. `rajshahi`). Set base fare, per-km rate, service fee, minimum fare, and commission split (e.g. 80/20).
2. **Admin → Content → Pay to Admin bKash:** Add the admin bKash number that customers pay to.
3. **Admin → Flags:** Enable/disable features like `FOOD_DELIVERY_ENABLED`, `MEDICINE_EXPRESS_ENABLED`.

### 3. Rider Onboarding

1. Rider visits `/rider/register` — submits name, NID, bKash account, vehicle type.
2. Admin reviews in **Admin → Riders (PENDING)** → clicks **Approve**.
3. Rider gets an in-app notification, signs in, and toggles **Go Online** in their dashboard.
4. **Auto-dispatch:** When a customer places an order, BullMQ runs a dispatcher every 15 seconds. It scores all online riders (60% proximity, 20% vehicle match, 20% trust/rating) and assigns the best match.

### 4. OTP Delivery Lifecycle

No SMS costs required — entirely in-app:

1. **Pickup:** Rider arrives → Customer generates Pickup OTP in their app → shows 6-digit code → Rider enters it → order moves to `PICKED_UP`.
2. **Delivery:** Rider arrives at destination → Customer generates Delivery OTP → shows code → Rider enters it → order moves to `DELIVERED`, rider balance credited.
3. A printable receipt is generated at `/orders/[id]/receipt`.

### 5. Payment Flows

| Method | Flow |
|---|---|
| **Cash on Delivery** | Customer pays rider directly in cash at delivery |
| **Pay to Rider (bKash)** | Customer sends bKash to rider's verified number, submits transaction ID |
| **Pay to Admin (bKash)** | Customer sends bKash to NagarGo admin number, submits transaction ID |

Admin manually verifies bKash transactions in **Admin → Payments** → clicks **Verify** or **Reject**.

### 6. Medicine Express

1. Customer visits `/medicine`, fills pharmacy name + medicine list, uploads prescription photo.
2. Admin reviews in **Admin → Medicine** before dispatching.
3. Rider is dispatched to the pharmacy, then to the customer.

### 7. Disputes

- Customer can file a dispute from the order tracking page within 48 hours of delivery.
- Admin reviews in **Admin → Disputes** — can side with customer, side with rider, or dismiss.
- Resolution note is sent to the customer via in-app notification.

### 8. Telegram Integration

- Talk to `@BotFather` on Telegram → create bot → get token → set `TELEGRAM_BOT_TOKEN`.
- Riders link their accounts via **Rider Dashboard → Connect Telegram** for instant order alerts.
- Admins receive platform-wide alerts (new orders, cancellations, rider actions) via `TELEGRAM_CHAT_ID`.

---

## 🔒 Security Posture

| Feature | Implementation |
|---|---|
| Auth | JWT (15-min access + 30-day refresh) · bcrypt password hashing |
| OTP | 6-digit codes · 10-min TTL · Redis-backed · invalidated after use |
| Rate limiting | Redis-backed limiters on auth, OTP, file upload endpoints |
| Suspended accounts | Hard 403 in JWT middleware for SUSPENDED riders/customers |
| Input validation | Zod schemas on all request bodies |
| File uploads | Cloudinary CDN · type + size validation · MIME check |
| Web security | CSP · HSTS · X-Frame-Options · Permissions-Policy (`next.config.js`) |
| Admin access | PIN-based bootstrap, then JWT-scoped admin role |
| Audit log | All sensitive admin actions written to immutable `AuditLog` collection |
| Order state machine | All status transitions validated against `ORDER_TRANSITIONS` map |

---

## 📊 Monitoring & Ops

- **Swagger API Docs:** `/api/docs` (interactive, all endpoints documented)
- **API Spec JSON:** `/api/docs.json` (importable into Postman/Insomnia)
- **Admin Dashboard:** `/admin` — real-time metrics, 30s auto-refresh, audit log with search
- **BullMQ Jobs:** Dispatch jobs run every 15s for `SEARCHING_RIDER` orders
- **Socket.io:** Real-time rider location updates broadcast per order room

---

## 🧪 Testing

```bash
# From apps/api — runs 20 unit tests
npm run test

# Verbose output
npx vitest run --reporter=verbose
```

Test coverage:
- `pricing.test.ts` — 9 tests (fare calculation, peak/emergency multipliers, commission splits)
- `hash.test.ts` — 7 tests (bcrypt, numeric OTP generation)
- `orderStateMachine.test.ts` — 4 tests (illegal transitions, OTP skip prevention, terminal states)
