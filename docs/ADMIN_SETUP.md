# Admin & Telegram Setup

## Admin bootstrap PIN

On first startup, if no `AdminAccount` exists yet, the API creates
one automatically using `ADMIN_BOOTSTRAP_PIN` from your `.env`
(defaults to `5555` in `.env.example`).

Important details:

- The PIN is **hashed with Argon2 before it is ever saved** — it is
  never written to the database, logged, or returned by any API
  response in plaintext, including the bootstrap value itself.
- The created account has `mustChangePin: true`. The admin frontend
  should treat this flag as a hard redirect to a "change your PIN"
  screen — don't let a bootstrap session reach the rest of the admin
  panel first.
- Change `POST /api/admin/auth/change-pin` requires the *current*
  PIN and rejects reusing the bootstrap value.
- Set `ADMIN_BOOTSTRAP_ENABLED=false` in your `.env` once a real
  admin account exists, so a wiped database doesn't silently
  recreate a `5555`-PIN account in production.
- `POST /api/admin/auth/logout-all` invalidates every previously
  issued admin JWT (bumps `sessionVersion`) — use this if you ever
  suspect a token has leaked.

## Telegram operations feed

1. Message **@BotFather** on Telegram and run `/newbot` to create a
   bot. You'll get a bot token that looks like
   `123456789:AA...` — keep it secret.
2. Message your new bot at least once (anything, so it can see your
   chat).
3. Find your numeric chat ID — the simplest way is to message
   **@userinfobot**, or call
   `https://api.telegram.org/bot<token>/getUpdates` and read the
   `chat.id` field from the response.
4. Put both values in your local `.env` (never commit this file):
   ```
   TELEGRAM_BOT_TOKEN=your-real-token
   TELEGRAM_CHAT_ID=your-real-chat-id
   ```
5. Start the API, log in as admin, and call
   `POST /api/admin/telegram/test`. You should see
   "NagarGo Telegram Integration Connected Successfully ✓" in the
   chat.

If either variable is left blank, the API runs normally — events are
logged to the server console instead of sent to Telegram. An order
can never fail because Telegram is unreachable or unconfigured.

**If a bot token or chat ID is ever pasted somewhere it could be
seen by others (chat logs, screenshots, a public repo), treat it as
compromised and generate a new token via BotFather immediately.**
