import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { EmailSender } from "@/lib/octomailer-client";

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { campaignId, testMode = false, testEmail } = body;

  try {
    const emailSender = new EmailSender();

    if (testMode && testEmail) {
      // Send test email
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      const { data: account } = await supabase
        .from("email_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      const testContact = {
        email: testEmail,
        first_name: "Test",
        last_name: "User",
        company: "Test Company",
      };

      const result = await emailSender.sendCampaignEmail(
        campaignId,
        testContact,
        account,
        {
          subject: campaign.subject,
          html: campaign.content_html,
          text: campaign.content_text,
        },
      );

      return NextResponse.json(result);
    } else {
      // Send bulk campaign
      const result = await emailSender.sendBulkCampaign(campaignId);
      return NextResponse.json(result);
    }
  } catch (error: any) {
    console.error("Send error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send emails" },
      { status: 500 },
    );
  }
}
