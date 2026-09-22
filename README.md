# NagarGo — Full Hosting, Deployment, and Usage Guide

Welcome to the definitive deployment and usage guide for **NagarGo**, a production-ready, hyperlocal delivery platform for Rajshahi. 

This guide covers everything required to run the platform locally, deploy it to a production environment, and operate the admin and rider apps.

---

## 🏗 System Architecture

The project is structured as an NPM monorepo using Turborepo.

*   `apps/api` — Node.js / Express backend (TypeScript, Mongoose, Redis, Socket.io, BullMQ)
*   `apps/web` — Next.js 14 frontend (App Router, Tailwind CSS, Playwright)

---

## 💻 Local Development (Run Locally)

### Prerequisites
1.  **Node.js** (v20+ recommended)
2.  **MongoDB** (Local instance or free MongoDB Atlas cluster)
3.  **Redis** (Local instance or Upstash free tier)

### 1. Setup Environment Variables

In `apps/api`, create a `.env` file:
```env
NODE_ENV=development
PORT=4000
APP_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:4000

# Databases
MONGODB_URI=mongodb://localhost:27017/nagargo
REDIS_HOST=localhost
REDIS_PORT=6379

# Secrets (use long random strings)
JWT_SECRET=super_secret_jwt_key
JWT_REFRESH_SECRET=super_secret_refresh_key

# Optional external integrations
GOOGLE_MAPS_API_KEY=your_google_maps_key
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

In `apps/web`, create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### 2. Install & Run
From the root directory, install dependencies and start both apps simultaneously:

```bash
# Install dependencies
npm install

# Start development servers (runs both API and Web concurrently)
npm run dev
```
*   **Web App** will be available at: `http://localhost:3000`
*   **API Server** will be available at: `http://localhost:4000`

---

## 🚀 Production Hosting & Deployment

To achieve a resilient, scalable, zero-downtime deployment, we recommend the following stack:

*   **Database:** MongoDB Atlas (M0/Serverless is fine for starting out)
*   **Cache / Queue:** Upstash Redis (Serverless)
*   **Frontend (Web):** Vercel
*   **Backend (API):** Render, Railway, or DigitalOcean App Platform

### 1. Backend (API) Deployment (e.g., Render / Railway)

The backend is a standard Node.js server.
1.  Connect your GitHub repository.
2.  Set the **Root Directory** to `apps/api` (if deploying just the API directory) or use the root and set the build command.
    *   **Build Command:** `npm install && npm run build --filter=api`
    *   **Start Command:** `cd apps/api && npm run start`
3.  Inject all `.env` variables from the local development step into the environment settings. Ensure you update `NODE_ENV=production` and set `APP_BASE_URL` to your production frontend domain (e.g., `https://nagargo.com`).

### 2. Frontend (Web) Deployment (Vercel)

Vercel provides the best out-of-the-box experience for Next.js.
1.  Import your GitHub repository into Vercel.
2.  Vercel will auto-detect Next.js and Turborepo.
3.  **Root Directory:** Keep it at the repo root. Vercel will automatically build the `web` workspace.
4.  Set Environment Variables in Vercel:
    *   `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`
    *   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...`
5.  Click **Deploy**.

---

## 🛠 Feature Usage & Workflows

### 1. Admin Bootstrapping
On a fresh deployment, there are no admin accounts. You can log in immediately using the bootstrap pin:
*   Navigate to `/admin`
*   Enter the `ADMIN_BOOTSTRAP_PIN` (default is `5555`).
*   **Important:** Once logged in, immediately go to the "Security" tab and change the PIN to a secure 6-digit number. You can then set `ADMIN_BOOTSTRAP_ENABLED=false` in your `.env` for security.

### 2. Core Config Setup (Mandatory First Steps)
Before customers can place orders, you must configure the platform:
1.  Go to **Admin > Config**
2.  **Pricing:** Set your base fare, per-km rate, service fee, minimum fare, and configure the Rider/NagarGo commission split (e.g., 80/20).
3.  **Payment Info:** Add the Admin bKash number where customers should send payments if they choose "Pay to Admin".

### 3. Rider Onboarding & Dispatch
1.  Riders go to `https://nagargo.com/rider/register` and submit an application with their NID, vehicle info, and bKash payout account.
2.  Admins go to **Admin > Riders (Pending)** and click **APPROVE**.
3.  The rider receives an SMS/Notification, signs in, and toggles their status to **Online**.
4.  **Auto-Dispatch:** When a customer places an order, the system (via BullMQ) sweeps every 15 seconds. It scores all online riders (60% distance, 20% vehicle preference, 20% quality rating) and auto-assigns the best match.

### 4. The Delivery Lifecycle (OTP Verification)
NagarGo uses an in-app OTP system (no SMS costs required):
1.  Rider arrives at pickup. Customer looks at their app, sees a 6-digit **Pickup OTP**. Customer shows this to the Rider.
2.  Rider enters the code into their dashboard. The order transitions to **PICKED_UP**.
3.  Rider drives to the destination. Receiver (Customer) looks at their app, sees a 6-digit **Delivery OTP**.
4.  Rider enters the code. Order transitions to **DELIVERED**. Customer is charged, Rider balance is credited.
5.  A printable receipt is immediately generated at `/orders/[id]/receipt`.

### 5. Telegram Integration
NagarGo has a deep Telegram bot integration for instant alerts without WebSockets.
*   Talk to `@BotFather` on Telegram, create a bot, and get the token.
*   Put it in `TELEGRAM_BOT_TOKEN`.
*   Riders can link their accounts via `/rider/dashboard` -> "Connect Telegram". They will get instant notifications for new orders assigned to them.
*   Admins can receive global alerts by placing a group chat ID in `TELEGRAM_CHAT_ID`.

---

## 🔒 Security Posture

*   **Rate Limiting:** Redis-backed limiters on OTP requests, authentication, and file uploads.
*   **Web Security:** Strict Content-Security-Policy (CSP) headers, HSTS, and Permissions-Policy configured in `next.config.js`.
*   **Suspended Accounts:** Hard 403 blocks in the JWT middleware if a Rider or Customer is marked as `SUSPENDED`.
*   **Audit Logging:** All sensitive admin actions (approving riders, changing prices, resolving disputes) are written to an immutable Audit Log collection (viewable in the Admin dashboard).
