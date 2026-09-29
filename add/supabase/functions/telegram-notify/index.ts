import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationBody {
  type?: "order" | "rider_application" | "support_ticket" | "payment" | "payout" | "review" | "login" | "registration" | "location" | "rider_fee";
  rider_id?: string;
  rider_name?: string;
  rider_phone?: string;
  fee_type?: string;
  payment_id?: string;
  payout_id?: string;
  order_id?: string;
  service_type?: string;
  customer_name?: string;
  pickup_address?: string;
  dropoff_address?: string;
  pickup_area?: string;
  dropoff_area?: string;
  total_fare?: number;
  payment_method?: string;
  distance_km?: number;
  pickup_contact_phone?: string;
  dropoff_contact_phone?: string;
  package_description?: string;
  special_instructions?: string;
  prescription_url?: string;
  rider_name?: string;
  rider_phone?: string;
  vehicle_type?: string;
  vehicle_registration?: string;
  nid_number?: string;
  preferred_zone?: string;
  ticket_id?: string;
  subject?: string;
  category?: string;
  description?: string;
  amount?: number;
  trx_id?: string;
  sender_bkash_number?: string;
  bkash_number?: string;
  rating?: number;
  service?: string;
  comment?: string;
  reviewer_name?: string;
  user_email?: string;
  user_phone?: string;
  location_name?: string;
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
}

const SERVICE_LABELS: Record<string, string> = {
  parcel: "Parcel Delivery",
  medicine: "Medicine Express",
  ride: "Ride Booking",
};

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatOrderMessage(b: NotificationBody): string {
  const serviceLabel = SERVICE_LABELS[b.service_type || ""] || b.service_type || "Unknown";
  const lines: string[] = [
    `🛵 <b>New Order — ${escapeHtml(serviceLabel)}</b>`, ``,
    `<b>Order ID:</b> <code>${escapeHtml(b.order_id || "")}</code>`,
    `<b>Customer:</b> ${escapeHtml(b.customer_name || "N/A")}`,
  ];
  if (b.pickup_address || b.pickup_area) lines.push(`<b>From:</b> ${escapeHtml(b.pickup_address || "")}${b.pickup_area ? `, ${escapeHtml(b.pickup_area)}` : ""}`);
  if (b.dropoff_address || b.dropoff_area) lines.push(`<b>To:</b> ${escapeHtml(b.dropoff_address || "")}${b.dropoff_area ? `, ${escapeHtml(b.dropoff_area)}` : ""}`);
  if (b.pickup_contact_phone) lines.push(`<b>Pickup Phone:</b> ${escapeHtml(b.pickup_contact_phone)}`);
  if (b.dropoff_contact_phone) lines.push(`<b>Dropoff Phone:</b> ${escapeHtml(b.dropoff_contact_phone)}`);
  if (b.package_description) lines.push(`<b>Package:</b> ${escapeHtml(b.package_description)}`);
  if (b.special_instructions) lines.push(`<b>Notes:</b> ${escapeHtml(b.special_instructions)}`);
  if (b.distance_km !== undefined && b.distance_km !== null) lines.push(`<b>Distance:</b> ${b.distance_km.toFixed(1)} km`);
  lines.push(`<b>Total Fare:</b> ৳${b.total_fare || 0}`);
  lines.push(`<b>Payment:</b> ${escapeHtml(b.payment_method || "N/A")}`);
  if (b.prescription_url) lines.push(`\n📄 <a href="${escapeHtml(b.prescription_url)}">View Prescription</a>`);
  return lines.join("\n");
}

function formatRiderApplicationMessage(b: NotificationBody): string {
  const lines: string[] = [
    `🧑 <b>New Rider Application</b>`, ``,
    `<b>Name:</b> ${escapeHtml(b.rider_name || "N/A")}`,
    `<b>Phone:</b> ${escapeHtml(b.rider_phone || "N/A")}`,
    `<b>Vehicle:</b> ${escapeHtml(b.vehicle_type || "N/A")}`,
    `<b>Registration:</b> ${escapeHtml(b.vehicle_registration || "N/A")}`,
  ];
  if (b.nid_number) lines.push(`<b>NID:</b> ${escapeHtml(b.nid_number)}`);
  if (b.preferred_zone) lines.push(`<b>Preferred Zone:</b> ${escapeHtml(b.preferred_zone)}`);
  return lines.join("\n");
}

function formatSupportTicketMessage(b: NotificationBody): string {
  const lines: string[] = [
    `🎫 <b>New Support Ticket</b>`, ``,
    `<b>Ticket ID:</b> <code>${escapeHtml(b.ticket_id || "")}</code>`,
    `<b>Subject:</b> ${escapeHtml(b.subject || "N/A")}`,
    `<b>Category:</b> ${escapeHtml(b.category || "N/A")}`,
  ];
  if (b.description) lines.push(`\n<b>Description:</b>\n${escapeHtml(b.description)}`);
  return lines.join("\n");
}

function formatPaymentMessage(b: NotificationBody): string {
  return [
    `💳 <b>New Payment Submission</b>`, ``,
    `<b>Order ID:</b> <code>${escapeHtml(b.order_id || "")}</code>`,
    `<b>Amount:</b> ৳${b.amount || 0}`,
    `<b>TRX ID:</b> <code>${escapeHtml(b.trx_id || "")}</code>`,
    `<b>Sender bKash:</b> ${escapeHtml(b.sender_bkash_number || "N/A")}`,
  ].join("\n");
}

function formatPayoutMessage(b: NotificationBody): string {
  return [
    `💸 <b>New Payout Request</b>`, ``,
    `<b>Rider:</b> ${escapeHtml(b.rider_name || "N/A")}`,
    `<b>Amount:</b> ৳${b.amount || 0}`,
    `<b>bKash:</b> ${escapeHtml(b.bkash_number || "N/A")}`,
  ].join("\n");
}

function formatReviewMessage(b: NotificationBody): string {
  const stars = "⭐".repeat(b.rating || 5);
  const lines: string[] = [
    `📝 <b>New Review Submitted</b>`, ``,
    `<b>Reviewer:</b> ${escapeHtml(b.reviewer_name || "N/A")}`,
    `<b>Rating:</b> ${stars} (${b.rating || 5}/5)`,
    `<b>Service:</b> ${escapeHtml(b.service || "N/A")}`,
  ];
  if (b.comment) lines.push(`\n<b>Comment:</b>\n${escapeHtml(b.comment)}`);
  return lines.join("\n");
}

function formatLoginMessage(b: NotificationBody): string {
  const lines: string[] = [
    `🔑 <b>User Login</b>`, ``,
    `<b>Name:</b> ${escapeHtml(b.customer_name || "N/A")}`,
    `<b>Email:</b> ${escapeHtml(b.user_email || "N/A")}`,
  ];
  if (b.user_phone) lines.push(`<b>Phone:</b> ${escapeHtml(b.user_phone)}`);
  return lines.join("\n");
}

function formatRegistrationMessage(b: NotificationBody): string {
  const lines: string[] = [
    `🎉 <b>New Registration</b>`, ``,
    `<b>Name:</b> ${escapeHtml(b.customer_name || "N/A")}`,
    `<b>Email:</b> ${escapeHtml(b.user_email || "N/A")}`,
  ];
  if (b.user_phone) lines.push(`<b>Phone:</b> ${escapeHtml(b.user_phone)}`);
  return lines.join("\n");
}

function formatLocationMessage(b: NotificationBody): string {
  const lines: string[] = [
    `📍 <b>New Saved Location</b>`, ``,
    `<b>Name:</b> ${escapeHtml(b.location_name || "N/A")}`,
    `<b>Address:</b> ${escapeHtml(b.location_address || "N/A")}`,
  ];
  if (b.location_lat && b.location_lng) {
    lines.push(`<b>Coordinates:</b> ${b.location_lat.toFixed(4)}, ${b.location_lng.toFixed(4)}`);
  }
  if (b.customer_name) lines.push(`<b>User:</b> ${escapeHtml(b.customer_name)}`);
  return lines.join("\n");
}

function formatRiderFeeMessage(b: NotificationBody): string {
  const feeLabel = b.fee_type === "registration" ? "Registration Fee (৳50)" : "Monthly Maintenance Fee (৳50)";
  const lines: string[] = [
    `💰 <b>Rider Fee Payment — ${escapeHtml(feeLabel)}</b>`, ``,
    `<b>Rider:</b> ${escapeHtml(b.rider_name || "N/A")}`,
    `<b>Phone:</b> ${escapeHtml(b.rider_phone || "N/A")}`,
    `<b>Amount:</b> ৳50`,
  ];
  if (b.trx_id) lines.push(`<b>TRX ID:</b> <code>${escapeHtml(b.trx_id)}</code>`);
  return lines.join("\n");
}

async function getTelegramConfig(): Promise<{ botToken: string | null; chatId: string | null }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase.from("system_configs").select("key, value").in("key", ["telegram_bot_token", "telegram_chat_id"]);
    if (!error && data && data.length > 0) {
      const tokenRow = data.find((r: { key: string }) => r.key === "telegram_bot_token");
      const chatRow = data.find((r: { key: string }) => r.key === "telegram_chat_id");
      return {
        botToken: tokenRow?.value || Deno.env.get("TELEGRAM_BOT_TOKEN") || null,
        chatId: chatRow?.value || Deno.env.get("TELEGRAM_CHAT_ID") || null,
      };
    }
  }
  return { botToken: Deno.env.get("TELEGRAM_BOT_TOKEN"), chatId: Deno.env.get("TELEGRAM_CHAT_ID") };
}

function getInlineKeyboard(type: string, body: NotificationBody) {
  if (type === "rider_application" && body.rider_id) {
    return { inline_keyboard: [[
      { text: "✅ Approve", callback_data: `rider_approve:${body.rider_id}` },
      { text: "❌ Deny", callback_data: `rider_reject:${body.rider_id}` },
    ]] };
  }
  if (type === "payment" && body.payment_id) {
    return { inline_keyboard: [[
      { text: "✅ Verify", callback_data: `payment_verify:${body.payment_id}` },
      { text: "❌ Reject", callback_data: `payment_reject:${body.payment_id}` },
    ]] };
  }
  if (type === "payout" && body.payout_id) {
    return { inline_keyboard: [[
      { text: "✅ Approve", callback_data: `payout_paid:${body.payout_id}` },
      { text: "❌ Deny", callback_data: `payout_reject:${body.payout_id}` },
    ]] };
  }
  return undefined;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const body: NotificationBody = await req.json();
    const type = body.type || "order";
    const { botToken, chatId } = await getTelegramConfig();

    if (!botToken || !chatId) {
      return new Response(JSON.stringify({ error: "Telegram bot token or chat ID not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let message: string;
    switch (type) {
      case "rider_application": message = formatRiderApplicationMessage(body); break;
      case "support_ticket": message = formatSupportTicketMessage(body); break;
      case "payment": message = formatPaymentMessage(body); break;
      case "payout": message = formatPayoutMessage(body); break;
      case "review": message = formatReviewMessage(body); break;
      case "login": message = formatLoginMessage(body); break;
      case "registration": message = formatRegistrationMessage(body); break;
      case "location": message = formatLocationMessage(body); break;
      case "rider_fee": message = formatRiderFeeMessage(body); break;
      default:
        if (!body.order_id || !body.service_type) {
          return new Response(JSON.stringify({ error: "Missing required fields: order_id, service_type" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        message = formatOrderMessage(body);
    }

    const replyMarkup = getInlineKeyboard(type, body);
    const payload: Record<string, unknown> = {
      chat_id: chatId, text: message, parse_mode: "HTML", disable_web_page_preview: true,
    };
    if (replyMarkup) payload.reply_markup = replyMarkup;

    const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });

    if (!telegramRes.ok) {
      const errText = await telegramRes.text();
      return new Response(JSON.stringify({ error: `Telegram API error: ${errText}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const telegramData = await telegramRes.json();
    return new Response(JSON.stringify({ success: true, message_id: telegramData.result?.message_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
