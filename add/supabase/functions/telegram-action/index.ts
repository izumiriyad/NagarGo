import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function getTelegramConfig(): Promise<{ botToken: string | null; chatId: string | null }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase
      .from("system_configs")
      .select("key, value")
      .in("key", ["telegram_bot_token", "telegram_chat_id"]);

    if (!error && data && data.length > 0) {
      const tokenRow = data.find((r: { key: string }) => r.key === "telegram_bot_token");
      const chatRow = data.find((r: { key: string }) => r.key === "telegram_chat_id");
      return {
        botToken: tokenRow?.value || Deno.env.get("TELEGRAM_BOT_TOKEN") || null,
        chatId: chatRow?.value || Deno.env.get("TELEGRAM_CHAT_ID") || null,
      };
    }
  }

  return {
    botToken: Deno.env.get("TELEGRAM_BOT_TOKEN"),
    chatId: Deno.env.get("TELEGRAM_CHAT_ID"),
  };
}

async function answerCallbackQuery(botToken: string, callbackQueryId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

async function editMessageText(botToken: string, chatId: string, messageId: number, text: string, replyMarkup?: unknown) {
  const payload: Record<string, unknown> = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function sendMessage(botToken: string, chatId: string, text: string, replyMarkup?: unknown) {
  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const update = await req.json();
    const supabase = getSupabaseClient();
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Supabase not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { botToken, chatId } = await getTelegramConfig();
    if (!botToken) {
      return new Response(JSON.stringify({ error: "Bot token not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle callback query (button press)
    const callbackQuery = update.callback_query;
    if (callbackQuery) {
      const data: string = callbackQuery.data || "";
      const messageId = callbackQuery.message?.message_id;
      const fromChatId = callbackQuery.message?.chat?.id;
      const [action, entityId] = data.split(":");

      let resultText = "";
      let newCaption = "";

      // Approve actions — execute immediately
      switch (action) {
        case "rider_approve": {
          const { data: rider } = await supabase
            .from("riders").select("user_id, status").eq("id", entityId).maybeSingle();
          if (!rider) { resultText = "Rider not found"; break; }
          if (rider.status === "approved") { resultText = "Already approved"; break; }

          const { error: riderErr } = await supabase
            .from("riders").update({ status: "approved", approved_at: new Date().toISOString(), rejection_reason: null }).eq("id", entityId);
          if (riderErr) { resultText = `Error: ${riderErr.message}`; break; }

          if (rider.user_id) {
            await supabase.from("profiles").update({ role: "rider" }).eq("id", rider.user_id);
          }
          resultText = "✅ Rider approved";
          newCaption = "✅ <b>Rider Application — APPROVED</b>\n\nThe rider has been approved and can now accept orders.";
          break;
        }

        case "payment_verify": {
          const { error } = await supabase
            .from("payments").update({ status: "verified", verified_at: new Date().toISOString(), rejection_reason: null }).eq("id", entityId);
          if (error) { resultText = `Error: ${error.message}`; break; }
          resultText = "✅ Payment verified";
          newCaption = "✅ <b>Payment — VERIFIED</b>\n\nThe bKash payment has been verified.";
          break;
        }

        case "payout_paid": {
          const { error } = await supabase
            .from("payouts").update({ status: "paid", processed_at: new Date().toISOString(), rejection_reason: null }).eq("id", entityId);
          if (error) { resultText = `Error: ${error.message}`; break; }
          resultText = "✅ Payout approved";
          newCaption = "✅ <b>Payout — PAID</b>\n\nThe rider payout has been marked as paid.";
          break;
        }

        // Reject actions — store pending action and ask for reason
        case "rider_reject": {
          const { error: paErr } = await supabase
            .from("telegram_pending_actions").insert({
              action_type: "rider_reject", entity_id: entityId, entity_table: "riders",
              telegram_message_id: messageId, status: "pending",
            });
          if (paErr) { resultText = `Error: ${paErr.message}`; break; }

          resultText = "Please type the rejection reason";
          newCaption = "❌ <b>Rider Application — DENIED</b>\n\n⌨️ <i>Please type the reason for rejection below. The rider will see this message.</i>";
          break;
        }

        case "payment_reject": {
          const { error: paErr } = await supabase
            .from("telegram_pending_actions").insert({
              action_type: "payment_reject", entity_id: entityId, entity_table: "payments",
              telegram_message_id: messageId, status: "pending",
            });
          if (paErr) { resultText = `Error: ${paErr.message}`; break; }

          resultText = "Please type the rejection reason";
          newCaption = "❌ <b>Payment — REJECTED</b>\n\n⌨️ <i>Please type the reason for rejection below. The customer will see this message.</i>";
          break;
        }

        case "payout_reject": {
          const { error: paErr } = await supabase
            .from("telegram_pending_actions").insert({
              action_type: "payout_reject", entity_id: entityId, entity_table: "payouts",
              telegram_message_id: messageId, status: "pending",
            });
          if (paErr) { resultText = `Error: ${paErr.message}`; break; }

          resultText = "Please type the rejection reason";
          newCaption = "❌ <b>Payout — DENIED</b>\n\n⌨️ <i>Please type the reason for rejection below. The rider will see this message.</i>";
          break;
        }

        default:
          resultText = "Unknown action";
      }

      await answerCallbackQuery(botToken, callbackQuery.id, resultText);

      if (newCaption && fromChatId && messageId) {
        // For reject actions, add force_reply to the edited message so admin can type the reason
        if (action?.endsWith("_reject")) {
          const forceReply = { force_reply: true, selective: false, input_field_placeholder: "Type rejection reason..." };
          await editMessageText(botToken, String(fromChatId), messageId, newCaption, forceReply);
        } else {
          await editMessageText(botToken, String(fromChatId), messageId, newCaption);
        }
      }

      return new Response(JSON.stringify({ ok: true, result: resultText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle text message (rejection reason reply)
    const message = update.message;
    if (message && message.text && message.reply_to_message) {
      const replyToMessageId = message.reply_to_message.message_id;
      const reasonText = message.text;

      // Find the pending action by telegram_message_id
      const { data: pendingAction } = await supabase
        .from("telegram_pending_actions")
        .select("*")
        .eq("telegram_message_id", replyToMessageId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!pendingAction) {
        return new Response(JSON.stringify({ ok: true, result: "No pending action" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let resultText = "";
      let newCaption = "";

      switch (pendingAction.action_type) {
        case "rider_reject": {
          await supabase.from("riders").update({ status: "rejected", rejection_reason: reasonText }).eq("id", pendingAction.entity_id);
          resultText = "❌ Rider rejected with reason";
          newCaption = `❌ <b>Rider Application — REJECTED</b>\n\n<b>Reason:</b> ${reasonText}`;
          break;
        }
        case "payment_reject": {
          await supabase.from("payments").update({ status: "rejected", rejection_reason: reasonText }).eq("id", pendingAction.entity_id);
          resultText = "❌ Payment rejected with reason";
          newCaption = `❌ <b>Payment — REJECTED</b>\n\n<b>Reason:</b> ${reasonText}`;
          break;
        }
        case "payout_reject": {
          await supabase.from("payouts").update({ status: "rejected", processed_at: new Date().toISOString(), rejection_reason: reasonText }).eq("id", pendingAction.entity_id);
          resultText = "❌ Payout rejected with reason";
          newCaption = `❌ <b>Payout — REJECTED</b>\n\n<b>Reason:</b> ${reasonText}`;
          break;
        }
        default:
          resultText = "Unknown pending action";
      }

      // Mark pending action as completed
      await supabase.from("telegram_pending_actions").update({ status: "completed" }).eq("id", pendingAction.id);

      // Send confirmation message
      if (chatId) {
        await sendMessage(botToken, chatId, newCaption);
      }

      return new Response(JSON.stringify({ ok: true, result: resultText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
