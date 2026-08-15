// app/api/tracking/click/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const campaignId = searchParams.get("campaign");
  const contactId = searchParams.get("contact");
  const originalUrl = searchParams.get("url");

  if (campaignId && contactId && originalUrl) {
    // Record click event
    await supabase.from("email_events").insert({
      event_type: "clicked",
      link_url: originalUrl,
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
        status: "clicked",
        clicked_at: new Date().toISOString(),
        click_count: supabase.sql`click_count + 1`,
      })
      .eq("campaign_id", campaignId)
      .eq("contact_id", contactId);
  }

  // Redirect to original URL
  return NextResponse.redirect(decodeURIComponent(originalUrl));
}
