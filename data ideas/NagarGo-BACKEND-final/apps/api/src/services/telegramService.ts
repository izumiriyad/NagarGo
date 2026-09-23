import { env, isTelegramConfigured } from "../config/env";
import { Rider } from "../models/Rider";
import { recordAuditAction } from "./auditService";

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
  kind: "message" | "document";
  text: string;
  documentUrl?: string;
  caption?: string;
  attempts: number;
}

const queue: QueuedMessage[] = [];
let isProcessing = false;
const MAX_ATTEMPTS = 5;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

async function sendToTelegramApi(text: string): Promise<void> {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram API error ${res.status}: ${body}`);
  }
}

async function reviewRiderFromTelegram(command: string) {
  const parts = command.trim().split(/\s+/);
  const action = parts.shift()?.toLowerCase();
  const publicId = parts.shift();
  if (!publicId || !["/approve_rider", "/reject_rider", "/suspend_rider"].includes(action ?? "")) {
    await sendToTelegramApi("Usage:\n/approve_rider NGR-...\n/reject_rider NGR-... reason text\n/suspend_rider NGR-... reason text");
    return;
  }
  const rider = await Rider.findOne({ publicId });
  if (!rider) { await sendToTelegramApi(`Rider ${publicId} was not found.`); return; }
  const reason = parts.join(" ").trim();
  if (action !== "/approve_rider" && reason.length < 5) { await sendToTelegramApi("A rejection/suspension reason of at least 5 characters is required."); return; }
  const before = rider.status;
  rider.status = action === "/approve_rider" ? "VERIFIED" : action === "/reject_rider" ? "REJECTED" : "SUSPENDED";
  rider.rejectionReason = action === "/approve_rider" ? undefined : reason;
  await rider.save();
  await recordAuditAction({ actorType: "ADMIN", action: `TELEGRAM_RIDER_${rider.status}`, targetType: "Rider", targetId: String(rider._id), before: { status: before }, after: { status: rider.status }, reason });
  enqueue(`✅ TELEGRAM ADMIN ACTION\nRider: ${rider.publicId}\nName: ${rider.fullName}\nNew status: ${rider.status}\nReason: ${reason || "Approved"}`);
  await sendToTelegramApi(`Done. ${rider.publicId} is now ${rider.status}.${reason ? ` Reason: ${reason}` : ""}`);
}

let telegramPollingStarted = false;
export function startTelegramAdminPolling() {
  if (!isTelegramConfigured || telegramPollingStarted) return;
  telegramPollingStarted = true;
  let offset = 0;
  const poll = async () => {
    try {
      const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getUpdates?timeout=20&allowed_updates=%5B%22message%22%5D${offset ? `&offset=${offset}` : ""}`;
      const res = await fetch(url);
      const data = await res.json() as { ok?: boolean; result?: Array<{ update_id: number; message?: { chat?: { id?: number | string }; text?: string } }> };
      if (data.ok) {
        for (const update of data.result ?? []) {
          offset = update.update_id + 1;
          const chatId = update.message?.chat?.id;
          const text = update.message?.text?.trim();
          if (String(chatId) !== String(env.TELEGRAM_CHAT_ID) || !text) continue;
          if (text === "/help" || text === "/start") await sendToTelegramApi("NagarGo admin commands:\n/approve_rider NGR-...\n/reject_rider NGR-... reason\n/suspend_rider NGR-... reason");
          else if (/^\/(approve|reject|suspend)_rider\b/i.test(text)) await reviewRiderFromTelegram(text);
        }
      }
    } catch (err) { console.error("[telegram] admin polling failed:", (err as Error).message); }
    finally { setTimeout(poll, 1_000); }
  };
  void poll();
}

async function sendDocumentToTelegramApi(documentUrl: string, caption: string): Promise<void> {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendDocument`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, document: documentUrl, caption, parse_mode: "HTML" }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram document API error ${res.status}: ${body}`);
  }
}

async function processQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  while (queue.length > 0) {
    const message = queue[0];
    if (!message) break;
    try {
      if (message.kind === "document" && message.documentUrl && message.caption) {
        await sendDocumentToTelegramApi(message.documentUrl, message.caption);
      } else {
        await sendToTelegramApi(message.text);
      }
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
  queue.push({ kind: "message", text, attempts: 0 });
  void processQueue();
}

function enqueueDocument(documentUrl: string, caption: string) {
  if (!isTelegramConfigured) {
    console.log("[telegram:disabled] NID document not sent because Telegram is not configured");
    return;
  }
  queue.push({ kind: "document", text: "NID document", documentUrl, caption, attempts: 0 });
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

  riderNidDocument: (p: { publicId: string; name: string; phone: string; documentUrl: string }) =>
    enqueueDocument(p.documentUrl, `📄 <b>RIDER NID DOCUMENT</b>\nRider ID: ${escapeHtml(p.publicId)}\nName: ${escapeHtml(p.name)}\nPhone: ${escapeHtml(p.phone)}\nStatus: PENDING REVIEW`),

  orderStatusChanged: (p: { orderPublicId: string; status: string; actor: string; detail?: string }) =>
    enqueue(`🔄 ORDER STATUS\nOrder: ${p.orderPublicId}\nStatus: ${p.status}\nActor: ${p.actor}\nDetail: ${p.detail ?? "-"}`),

  otpRequested: (p: { orderPublicId: string; stage: "pickup" | "delivery"; requestedBy: string }) =>
    enqueue(`🔐 OTP REQUESTED\nOrder: ${p.orderPublicId}\nStage: ${p.stage.toUpperCase()}\nRequested by: ${p.requestedBy}\nCode value withheld for security`),

  riderAvailabilityChanged: (p: { riderPublicId: string; riderName: string; online: boolean }) =>
    enqueue(`📍 RIDER AVAILABILITY\nRider: ${p.riderPublicId}\nName: ${p.riderName}\nStatus: ${p.online ? "ONLINE" : "OFFLINE"}`),

  notificationDispatched: (p: { recipientType: string; recipientId: string; type: string; title: string }) =>
    enqueue(`🔔 NOTIFICATION\nRecipient: ${p.recipientType} ${p.recipientId}\nType: ${p.type}\nTitle: ${p.title}`),
};

export const telegramService = { events, sendTestMessage, isConfigured: isTelegramConfigured };
