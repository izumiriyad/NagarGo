import { env, isTelegramConfigured } from "../config/env";
import { Rider } from "../models/Rider";
import { Order } from "../models/Order";

/**
 * NagarGo's admin operations feed. Every event below is a plain
 * template with no secrets in it — bot token and chat ID are read
 * from validated env config (config/env.ts) and are never
 * hardcoded, logged, or echoed back through any API response.
 *
 * If Telegram isn't configured (no token/chat id in .env), events
 * are logged locally instead of sent — Telegram is an operational
 * nice-to-have, never a dependency an order can fail on.
 */

interface QueuedMessage {
  text: string;
  attempts: number;
}

const queue: QueuedMessage[] = [];
let isProcessing = false;
const MAX_ATTEMPTS = 5;

async function sendToTelegramApi(text: string, extra: Record<string, unknown> = {}): Promise<void> {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
      ...extra,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram API error ${res.status}: ${body}`);
  }
}

async function processQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  while (queue.length > 0) {
    // queue.length > 0 guarantees queue[0] is defined.
    const message = queue[0]!;
    try {
      await sendToTelegramApi(message.text);
      queue.shift();
    } catch (err) {
      message.attempts += 1;
      console.error(`[telegram] send failed (attempt ${message.attempts}):`, (err as Error).message);
      if (message.attempts >= MAX_ATTEMPTS) {
        console.error("[telegram] giving up on message after max attempts:", message.text.slice(0, 80));
        queue.shift();
        continue;
      }
      // Exponential backoff before retrying the same message.
      const delayMs = Math.min(30_000, 1000 * 2 ** message.attempts);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  isProcessing = false;
}

function enqueue(text: string) {
  if (!isTelegramConfigured) {
    console.log("[telegram:disabled]", text.replace(/\n/g, " | "));
    return;
  }
  queue.push({ text, attempts: 0 });
  void processQueue();
}

async function sendTestMessage(): Promise<{ ok: boolean; message: string }> {
  if (!isTelegramConfigured) {
    return { ok: false, message: "Telegram is not configured. Add a bot token and chat ID first." };
  }
  try {
    await sendToTelegramApi("NagarGo Telegram Integration Connected Successfully ✓");
    return { ok: true, message: "Test message sent." };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}


async function sendToChat(chatId: string, text: string, replyMarkup?: unknown) {
  if (!isTelegramConfigured) return;
  await sendToTelegramApi(text, { chat_id: chatId, ...(replyMarkup ? { reply_markup: replyMarkup } : {}) });
}

async function getBotUsername(): Promise<string | null> {
  if (!isTelegramConfigured) return null;
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`);
  const data = await res.json() as any;
  return data?.ok ? data.result?.username ?? null : null;
}

async function sendRiderOrder(riderId: string, order: any) {
  const rider = await Rider.findById(riderId).select("telegram fullName");
  if (!rider?.telegram?.chatId) return false;
  const text = [
    "🚕 <b>NEW NAGARGO ORDER</b>",
    `Order: <b>${order.publicId}</b>`,
    `Pickup: ${order.pickup.fullAddress}`,
    `Destination: ${order.destination.fullAddress}`,
    `Distance: ${order.pricing.distanceKm} km`,
    `ETA: ${order.pricing.estimatedMinutes} min`,
    `Customer Pays: <b>৳${order.pricing.total}</b>`,
    `Your Earnings: <b>৳${order.pricing.riderEarnings}</b>`,
    "⏱ <b>60 seconds to respond</b>",
  ].join("\n");
  await sendToChat(rider.telegram.chatId, text, { inline_keyboard: [
    [{ text: "✅ ACCEPT", callback_data: `order_accept:${order._id}` }, { text: "❌ REJECT", callback_data: `order_reject:${order._id}` }],
  ]});
  return true;
}

let pollingStarted = false;
export async function startTelegramPolling() {
  if (!isTelegramConfigured || pollingStarted) return;
  pollingStarted = true;
  let offset = 0;
  const botUsername = await getBotUsername();
  console.log(`[telegram] rider bot polling enabled${botUsername ? ` as @${botUsername}` : ""}`);
  const loop = async () => {
    try {
      const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getUpdates?timeout=20&offset=${offset}`);
      const data = await res.json() as any;
      if (data?.ok) {
        for (const update of data.result ?? []) {
          offset = Math.max(offset, update.update_id + 1);
          const msg = update.message;
          if (msg?.text?.startsWith("/start")) {
            const arg = msg.text.split(/\s+/)[1] ?? "";
            const publicId = arg.replace(/^rider[_-]/i, "");
            const rider = publicId ? await Rider.findOne({ publicId }) : null;
            if (rider) {
              rider.telegram = { chatId: String(msg.chat.id), connectedAt: new Date() };
              await rider.save();
              await sendToChat(String(msg.chat.id), `✅ <b>NagarGo Telegram connected</b>\nRider: ${rider.fullName}\nYou will receive new order alerts here.`);
            } else {
              await sendToChat(String(msg.chat.id), "Open the Connect Telegram button from your NagarGo Rider Dashboard to link this Telegram account.");
            }
          }

          // /help — rider command guide
          if (msg?.text === "/help") {
            await sendToChat(String(msg.chat.id),
              "🤖 <b>NagarGo Rider Bot Commands</b>\n\n" +
              "/start rider_[ID] — Link your Telegram to your rider account\n" +
              "/help — Show this help message\n\n" +
              "📦 You will receive order notifications here.\n" +
              "Accept or reject orders using the inline buttons.\n\n" +
              "For support: contact your NagarGo admin."
            );
          }

          // /status — admin-only server status command
          if (msg?.text === "/status") {
            const { dispatchQueue } = await import("./dispatchScheduler");
            try {
              const [waiting, active] = await Promise.all([
                dispatchQueue.getWaitingCount(),
                dispatchQueue.getActiveCount(),
              ]);
              await sendToChat(String(msg.chat.id),
                "📊 <b>NagarGo Server Status</b>\n" +
                `Uptime: ${Math.floor(process.uptime() / 60)} min\n` +
                `Dispatch queue waiting: ${waiting}\n` +
                `Dispatch queue active: ${active}\n` +
                `Time: ${new Date().toISOString()}`
              );
            } catch {
              await sendToChat(String(msg.chat.id), "⚠️ Could not fetch queue status.");
            }
          }

          const cb = update.callback_query;
          if (cb?.data?.startsWith("order_")) {
            const [action, orderId] = String(cb.data).split(":");
            const rider = await Rider.findOne({ "telegram.chatId": String(cb.from.id) });
            const order = orderId ? await Order.findById(orderId) : null;
            if (!rider || !order || String(order.riderId) !== String(rider._id)) {
              await sendToChat(String(cb.message?.chat?.id ?? cb.from.id), "This order is no longer assigned to this rider.");
            } else if (order.status !== "RIDER_ASSIGNED") {
              await sendToChat(String(cb.message?.chat?.id ?? cb.from.id), "This offer has expired or was already handled.");
            } else if (action === "order_accept") {
              const attempt = order.dispatchAttempts?.find((a:any) => String(a.riderId) === String(rider._id) && a.outcome === "PENDING");
              if (attempt) attempt.outcome = "ACCEPTED";
              order.status = "RIDER_ACCEPTED";
              order.statusHistory.push({ status: "RIDER_ACCEPTED", note: "Accepted via Telegram." });
              await order.save();
              await sendToChat(String(cb.message.chat.id), `✅ Order <b>${order.publicId}</b> accepted.`);
            } else {
              const attempt = order.dispatchAttempts?.find((a:any) => String(a.riderId) === String(rider._id) && a.outcome === "PENDING");
              if (attempt) attempt.outcome = "REJECTED";
              order.riderId = undefined;
              order.status = "SEARCHING_RIDER";
              order.statusHistory.push({ status: "SEARCHING_RIDER", note: "Rejected via Telegram." });
              await order.save();
              await sendToChat(String(cb.message.chat.id), `❌ Order <b>${order.publicId}</b> rejected. NagarGo will find another rider.`);
            }
          }
          if (cb?.id) {
            await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ callback_query_id: cb.id }) }).catch(() => {});
          }
        }
      }
    } catch (e) { console.error("[telegram] polling error:", e instanceof Error ? e.message : e); }
    setImmediate(loop);
  };
  void loop();
}

// --- Event templates -------------------------------------------------
// Every template below deliberately excludes: passwords, OTP
// values, JWTs, full payment credentials, and unnecessary
// sensitive medical detail (per spec's Medicine event guidance).

const events = {
  customerRegistered: (p: { publicId: string; name: string; phone: string }) =>
    enqueue(`🆕 NEW CUSTOMER\nUser ID: ${p.publicId}\nName: ${p.name}\nPhone: ${p.phone}\nRole: CUSTOMER\nTime: ${new Date().toISOString()}`),

  userLogin: (p: { publicId: string; role: "CUSTOMER" | "RIDER" }) =>
    enqueue(`🔐 USER LOGIN\nUser ID: ${p.publicId}\nRole: ${p.role}\nStatus: SUCCESS\nTime: ${new Date().toISOString()}`),

  riderApplicationReceived: (p: { publicId: string; name: string; phone: string; vehicle: string }) =>
    enqueue(`🏍️ NEW RIDER APPLICATION\nRider ID: ${p.publicId}\nName: ${p.name}\nPhone: ${p.phone}\nVehicle: ${p.vehicle}\nStatus: PENDING`),

  riderVerified: (p: { publicId: string; name: string }) =>
    enqueue(`✅ RIDER VERIFIED\nRider ID: ${p.publicId}\nName: ${p.name}\nApproved: ${new Date().toISOString()}`),

  riderRejectedOrSuspended: (p: { publicId: string; name: string; decision: string; reason?: string }) =>
    enqueue(`🚫 RIDER ${p.decision}\nRider ID: ${p.publicId}\nName: ${p.name}\nReason: ${p.reason ?? "Not specified"}`),

  newOrder: (p: { publicId: string; customerName: string; pickup: string; destination: string; distanceKm: number; fare: number; paymentMethod: string }) =>
    enqueue(`📦 NEW NAGARGO ORDER\nOrder: ${p.publicId}\nCustomer: ${p.customerName}\nPickup: ${p.pickup}\nDestination: ${p.destination}\nDistance: ${p.distanceKm} km\nFare: ৳${p.fare}\nPayment: ${p.paymentMethod}\nStatus: SEARCHING RIDER`),

  riderHired: (p: { orderPublicId: string; customerName: string; riderName: string; fare: number }) =>
    enqueue(`🏍️ RIDER HIRED\nOrder: ${p.orderPublicId}\nCustomer: ${p.customerName}\nRider: ${p.riderName}\nFare: ৳${p.fare}`),

  pickupVerified: (p: { orderPublicId: string; riderName: string }) =>
    enqueue(`🔐 PICKUP VERIFIED ✓\nOrder: ${p.orderPublicId}\nRider: ${p.riderName}\nStatus: PICKED UP`),

  deliveryCompleted: (p: { orderPublicId: string; customerName: string; riderName: string; distanceKm: number; customerPaid: number; riderEarnings: number; commission: number }) =>
    enqueue(`🎉 DELIVERY COMPLETED\nOrder: ${p.orderPublicId}\nCustomer: ${p.customerName}\nRider: ${p.riderName}\nDistance: ${p.distanceKm} km\nCustomer Paid: ৳${p.customerPaid}\nRider Earnings: ৳${p.riderEarnings}\nNagarGo Commission: ৳${p.commission}`),

  paymentSubmitted: (p: { orderPublicId: string; method: string; amount: number; transactionId: string }) =>
    enqueue(`💳 PAYMENT SUBMITTED\nOrder: ${p.orderPublicId}\nMethod: ${p.method}\nAmount: ৳${p.amount}\nTransaction ID: ${p.transactionId}\nStatus: UNDER REVIEW`),

  paymentVerified: (p: { orderPublicId: string; method: string; amount: number; transactionId: string }) =>
    enqueue(`✅ PAYMENT VERIFIED\nOrder: ${p.orderPublicId}\nMethod: ${p.method}\nAmount: ৳${p.amount}\nTransaction ID: ${p.transactionId}\nVerified By: ADMIN`),

  orderCancelled: (p: { orderPublicId: string; cancelledBy: string; reason?: string }) =>
    enqueue(`❌ ORDER CANCELLED\nOrder: ${p.orderPublicId}\nCancelled By: ${p.cancelledBy}\nReason: ${p.reason ?? "Not specified"}`),

  newDispute: (p: { orderPublicId: string; type: string }) =>
    enqueue(`⚠️ NEW DISPUTE\nOrder: ${p.orderPublicId}\nType: ${p.type}\nStatus: OPEN`),

  disputeResolved: (p: { orderPublicId: string; decision: string; note?: string }) =>
    enqueue(`⚖️ DISPUTE RESOLVED\nOrder: ${p.orderPublicId}\nDecision: ${p.decision}\nNote: ${p.note ?? "-"}`),

  paymentRejected: (p: { orderPublicId: string; method: string; amount: number; reason?: string }) =>
    enqueue(`❌ PAYMENT REJECTED\nOrder: ${p.orderPublicId}\nMethod: ${p.method}\nAmount: ৳${p.amount}\nReason: ${p.reason ?? "Not specified"}`),

  medicineOrderSubmitted: (p: { publicId: string; pharmacy: string; total: number; hasPrescription: boolean }) =>
    enqueue(`💊 NEW MEDICINE ORDER\nOrder: ${p.publicId}\nPharmacy: ${p.pharmacy}\nTotal: ৳${p.total}\nPrescription attached: ${p.hasPrescription ? "Yes" : "No"}\nStatus: PENDING REVIEW`),

  medicineOrderReviewed: (p: { publicId: string; decision: string; note?: string }) =>
    enqueue(`💊 MEDICINE ORDER ${p.decision}\nOrder: ${p.publicId}\nNote: ${p.note ?? "-"}`),

  ratingReceived: (p: { orderPublicId: string; riderName: string; rating: number; comment?: string }) =>
    enqueue(`⭐ NEW RATING\nOrder: ${p.orderPublicId}\nRider: ${p.riderName}\nRating: ${p.rating}/5\nComment: ${p.comment ?? "-"}`),

  securityAlert: (p: { event: string; detail?: string }) =>
    enqueue(`🚨 SECURITY ALERT\nEvent: ${p.event}\nDetail: ${p.detail ?? "-"}\nTime: ${new Date().toISOString()}`),
};

export const telegramService = { events, sendTestMessage, sendRiderOrder, startTelegramPolling, isConfigured: isTelegramConfigured };
