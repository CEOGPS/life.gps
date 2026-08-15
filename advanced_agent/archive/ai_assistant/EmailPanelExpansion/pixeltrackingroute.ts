import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { UAParser } from "ua-parser-js";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const campaignId = searchParams.get("campaign");
  const contactId = searchParams.get("contact");
  const sendId = searchParams.get("send");

  if (campaignId && contactId) {
    try {
      const userAgent = request.headers.get("user-agent") || "";
      const parser = new UAParser(userAgent);
      const device = parser.getDevice();
      const browser = parser.getBrowser();
      const os = parser.getOS();

      // Get or create send record
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
        // Record open event
        await supabase.from("email_events").insert({
          send_id: finalSendId,
          event_type: "opened",
          user_agent: userAgent,
          device_type: device.type || "desktop",
          ip_address:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
          event_data: {
            browser: browser.name,
            os: os.name,
            device: device.model,
            timestamp: new Date().toISOString(),
          },
        });

        // Update send record
        await supabase
          .from("campaign_sends")
          .update({
            status: "opened",
            opened_at: new Date().toISOString(),
            open_count: supabase.sql`open_count + 1`,
          })
          .eq("id", finalSendId);

        // Update campaign daily stats
        await supabase.rpc("increment_campaign_stats", {
          p_campaign_id: campaignId,
          p_date: new Date().toISOString().split("T")[0],
          p_opened_count: 1,
        });
      }
    } catch (error) {
      console.error("Tracking error:", error);
    }
  }

  // Return 1x1 transparent GIF
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64",
  );

  return new NextResponse(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
