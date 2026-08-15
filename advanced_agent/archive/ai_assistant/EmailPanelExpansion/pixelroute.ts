// app/api/tracking/pixel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const campaignId = searchParams.get("campaign");
  const contactId = searchParams.get("contact");

  if (campaignId && contactId) {
    // Record open event
    await supabase.from("email_events").insert({
      event_type: "opened",
      event_data: {
        campaign_id: campaignId,
        contact_id: contactId,
        user_agent: request.headers.get("user-agent"),
        ip_address: request.headers.get("x-forwarded-for"),
      },
    });

    // Update campaign_sends
    await supabase
      .from("campaign_sends")
      .update({
        status: "opened",
        opened_at: new Date().toISOString(),
        open_count: supabase.sql`open_count + 1`,
      })
      .eq("campaign_id", campaignId)
      .eq("contact_id", contactId);
  }

  // Return 1x1 transparent pixel
  const pixel = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );

  return new NextResponse(pixel, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
