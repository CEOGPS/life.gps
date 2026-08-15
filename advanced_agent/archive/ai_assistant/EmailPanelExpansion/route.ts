// app/api/webhooks/sendgrid/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const events = await request.json();

  for (const event of events) {
    const messageId = event.sg_message_id;
    const eventType = event.event;

    // Find the send record
    const { data: send } = await supabase
      .from("campaign_sends")
      .select("id")
      .eq("message_id", messageId)
      .single();

    if (send) {
      // Record webhook event
      await supabase.from("email_events").insert({
        send_id: send.id,
        event_type: eventType,
        event_data: event,
        created_at: new Date(event.timestamp * 1000).toISOString(),
      });

      // Update send status
      let status = null;
      if (eventType === "delivered") status = "delivered";
      if (eventType === "open") status = "opened";
      if (eventType === "click") status = "clicked";
      if (eventType === "bounce") status = "bounced";
      if (eventType === "spamreport") status = "spam";

      if (status) {
        await supabase
          .from("campaign_sends")
          .update({ status })
          .eq("id", send.id);
      }
    }
  }

  return NextResponse.json({ received: true });
}
