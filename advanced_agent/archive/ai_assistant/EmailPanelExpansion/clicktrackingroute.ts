import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const campaignId = searchParams.get("campaign");
  const contactId = searchParams.get("contact");
  const sendId = searchParams.get("send");
  const url = searchParams.get("url");
  const label = searchParams.get("label");

  if (!url) {
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  }

  if (campaignId && contactId) {
    try {
      let finalSendId = sendId;
      if (!finalSendId) {
        const { data: send } = await supabase
          .from("campaign_sends")
          .select("id")
          .eq("campaign_id", campaignId)
          .eq("contact_id", contactId)
          .single();

        finalSendId = send?.id;
      }

      if (finalSendId) {
        // Record click event
        await supabase.from("email_events").insert({
          send_id: finalSendId,
          event_type: "clicked",
          link_url: decodeURIComponent(url),
          link_label: label || "click",
          ip_address: request.headers.get("x-forwarded-for") || "unknown",
          event_data: {
            timestamp: new Date().toISOString(),
            user_agent: request.headers.get("user-agent"),
          },
        });

        // Update send record
        await supabase
          .from("campaign_sends")
          .update({
            status: "clicked",
            clicked_at: new Date().toISOString(),
            click_count: supabase.sql`click_count + 1`,
          })
          .eq("id", finalSendId);

        // Update campaign stats
        await supabase.rpc("increment_campaign_stats", {
          p_campaign_id: campaignId,
          p_date: new Date().toISOString().split("T")[0],
          p_clicked_count: 1,
        });
      }
    } catch (error) {
      console.error("Click tracking error:", error);
    }
  }

  // Decode and redirect
  const decodedUrl = decodeURIComponent(url);
  return NextResponse.redirect(decodedUrl);
}
