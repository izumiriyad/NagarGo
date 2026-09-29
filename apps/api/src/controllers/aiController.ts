import { Request, Response } from "express";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Simple rule-based AI Assistant for NagarGo.
// No external LLM required — instant, zero-cost, offline-capable.
// Can be swapped for OpenAI/Gemini API call by replacing `generateReply`.
// ---------------------------------------------------------------------------

interface HistoryEntry {
  role: "user" | "assistant";
  text: string;
}

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().max(2000),
      })
    )
    .max(20)
    .optional(),
});

// Intent → keywords mapping
const INTENTS: { keywords: string[]; reply: string }[] = [
  {
    keywords: ["how", "work", "deliver", "delivery", "service"],
    reply:
      "NagarGo connects you with ID-verified riders in Rajshahi for parcel delivery and Medicine Express. Simply book a delivery at /book, our system auto-assigns the nearest rider, and you can track them live. OTP verification is required at both pickup and drop-off for security.",
  },
  {
    keywords: ["rider", "become", "register", "join", "apply", "sign up"],
    reply:
      "To become a NagarGo rider: visit /rider/register, fill in your name, NID number, phone, vehicle type, and bKash payout number. Our team reviews your application. Once approved, you can go online and start accepting orders. You keep 80% of every delivery fare.",
  },
  {
    keywords: ["fare", "price", "pricing", "cost", "how much", "calculate", "fee"],
    reply:
      "Fares are calculated server-side based on: base fare + (distance in km × per-km rate) + service fee. For Rajshahi: base fare ৳40, ৳12/km, minimum ৳50, service fee ৳5. Emergency orders have a surcharge multiplier. The full breakdown is shown before you confirm.",
  },
  {
    keywords: ["otp", "code", "verify", "one-time", "pickup", "handoff"],
    reply:
      "OTP (One-Time Password) verification works like this: 1) The sender gets a 6-digit Pickup OTP — they show it to the rider at pickup. 2) The receiver gets a Delivery OTP — they show it to the rider at drop-off. No code = no release. OTPs expire after 10 minutes.",
  },
  {
    keywords: ["medicine", "prescription", "pharmacy", "drug", "meds"],
    reply:
      "Medicine Express lets you upload a doctor's prescription and specify the pharmacy. Our admin reviews the order before dispatch. A verified rider collects the medicine and delivers it to you securely. Prescriptions are stored privately and never shared.",
  },
  {
    keywords: ["bkash", "payment", "pay", "nagad", "cash", "transaction"],
    reply:
      "NagarGo supports 3 payment methods: (1) Cash on Delivery — pay the rider directly in cash. (2) Pay to Rider bKash — send bKash to your rider's number and submit the transaction ID. (3) Pay to Admin bKash — send to NagarGo's admin bKash number. All bKash payments are manually verified.",
  },
  {
    keywords: ["track", "live", "location", "gps", "where", "map"],
    reply:
      "Once a rider is assigned, you can track their live GPS location on the order tracking page (/orders/[id]/track). The map updates every few seconds via WebSocket. You can also share the tracking link with others.",
  },
  {
    keywords: ["dispute", "problem", "complaint", "issue", "refund", "wrong", "damage"],
    reply:
      "If you have an issue with a delivery: go to your Orders page → find the order → click 'Track' → scroll to 'File a Dispute'. Describe the issue and category. Our admin team reviews and resolves disputes within 24–48 hours. Resolution notices are sent to all parties.",
  },
  {
    keywords: ["cancel", "cancell"],
    reply:
      "You can cancel an order before a rider is assigned (CREATED or SEARCHING_RIDER status) from the order tracking page. Once a rider is en route, cancellation may not be possible. Repeated cancellations affect your account standing.",
  },
  {
    keywords: ["account", "login", "sign in", "password", "profile", "signup"],
    reply:
      "To create an account, visit /signup. To sign in, visit /login. Your profile (name, phone, email, photo) can be updated from /account. If you forget your password, use the 'Forgot password' link on the login page.",
  },
  {
    keywords: ["earning", "money", "income", "payout", "commission"],
    reply:
      "Riders earn 80% of every delivery fare. Earnings are shown on your Rider Dashboard → Earnings page. Payouts are processed to your registered bKash number. Contact admin for early payout requests. Your trust score affects priority order assignment.",
  },
  {
    keywords: ["telegram", "notification", "alert", "connect"],
    reply:
      "NagarGo sends instant Telegram notifications for order updates. Riders: connect your Telegram from the Rider Dashboard → 'Connect Telegram' button. Customers also receive in-app notifications for every status change.",
  },
  {
    keywords: ["hello", "hi", "hey", "salaam", "assalamu"],
    reply:
      "Hello! Welcome to NagarGo 👋 I'm here to help with anything about our delivery service. You can ask me about: booking a delivery, becoming a rider, fares, payment, live tracking, OTP, Medicine Express, or disputes.",
  },
];

function generateReply(message: string, _history?: HistoryEntry[]): string {
  const lower = message.toLowerCase();

  for (const intent of INTENTS) {
    if (intent.keywords.some((kw) => lower.includes(kw))) {
      return intent.reply;
    }
  }

  // Default fallback
  return (
    "I'm not sure about that specific question. For more help, you can: " +
    "(1) Check our FAQ at the bottom of the homepage, " +
    "(2) Contact us via WhatsApp at +88 01683-772714, " +
    "(3) Email us at support@nagargo.com, or " +
    "(4) Visit /legal/terms for platform policies."
  );
}

export async function aiChat(req: Request, res: Response) {
  const { message, history } = chatSchema.parse(req.body);
  const reply = generateReply(message, history);
  res.json({ reply });
}
