// lib/octomailer-client.ts
import {
  Octomailer,
  SendGridProvider,
  BrevoProvider,
  EmailOptions,
} from "octomailer";
import { supabase } from "./supabase";

export class EmailSender {
  private mailer: Octomailer;
  private accountWeights: Map<string, number> = new Map();

  constructor() {
    // Initialize providers with weights
    const providers = [];

    // SendGrid (weight 1)
    if (process.env.SENDGRID_API_KEY) {
      providers.push(new SendGridProvider(process.env.SENDGRID_API_KEY, 1));
    }

    // Brevo (weight 3 - higher because more free tier emails)
    if (process.env.BREVO_API_KEY) {
      providers.push(new BrevoProvider(process.env.BREVO_API_KEY, 3));
    }

    this.mailer = new Octomailer(providers);
  }

  async sendCampaignEmail(
    campaignId: string,
    contact: any,
    account: any,
    content: { subject: string; html: string; text: string },
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Personalize content
      const personalizedHtml = this.personalizeContent(content.html, contact);
      const personalizedText = this.personalizeContent(content.text, contact);
      const personalizedSubject = this.personalizeContent(
        content.subject,
        contact,
      );

      // Add tracking pixel
      const trackingPixel = this.generateTrackingPixel(campaignId, contact.id);
      const htmlWithTracking = personalizedHtml.replace(
        "</body>",
        `${trackingPixel}</body>`,
      );

      // Process links for click tracking
      const htmlWithTrackingLinks = await this.processLinksForTracking(
        htmlWithTracking,
        campaignId,
        contact.id,
      );

      const emailOptions: EmailOptions = {
        to: contact.email,
        from: account.email,
        fromName: account.display_name,
        subject: personalizedSubject,
        html: htmlWithTrackingLinks,
        text: personalizedText,
      };

      // Send via Octomailer (auto-load balances between providers)
      const result = await this.mailer.send(emailOptions);

      // Record the send in database
      await this.recordSend(
        campaignId,
        contact.id,
        account.id,
        result.messageId,
      );

      // Update account daily stats
      await this.updateAccountStats(account.id);

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("Failed to send email:", error);
      return { success: false, error: error.message };
    }
  }

  async sendBulkCampaign(campaignId: string) {
    // Get campaign details
    const { data: campaign } = await supabase
      .from("campaigns")
      .select(
        `
        *,
        email_accounts (*)
      `,
      )
      .eq("id", campaignId)
      .single();

    if (!campaign) throw new Error("Campaign not found");

    // Get contacts from lists
    const { data: contacts } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", campaign.user_id)
      .eq("verification_status", "valid") // Only send to verified emails
      .in(
        "id",
        supabase
          .from("contact_list_members")
          .select("contact_id")
          .in("list_id", campaign.list_ids),
      );

    if (!contacts?.length) return { sent: 0, failed: 0 };

    let sent = 0;
    let failed = 0;
    const account = campaign.email_accounts;

    for (const contact of contacts) {
      // Check daily limit
      const { data: dailyStats } = await supabase
        .from("account_daily_stats")
        .select("sent_count")
        .eq("account_id", account.id)
        .eq("date", new Date().toISOString().split("T")[0])
        .single();

      if (dailyStats && dailyStats.sent_count >= (account.daily_limit || 500)) {
        console.log(`Daily limit reached for account ${account.email}`);
        break;
      }

      const result = await this.sendCampaignEmail(
        campaignId,
        contact,
        account,
        {
          subject: campaign.subject,
          html: campaign.content_html,
          text: campaign.content_text,
        },
      );

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Update campaign status
    await supabase
      .from("campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    return { sent, failed };
  }

  private personalizeContent(content: string, contact: any): string {
    if (!content) return "";

    return content
      .replace(/{{first_name}}/g, contact.first_name || "")
      .replace(/{{last_name}}/g, contact.last_name || "")
      .replace(/{{company}}/g, contact.company || "")
      .replace(/{{job_title}}/g, contact.job_title || "")
      .replace(/{{email}}/g, contact.email);
  }

  private generateTrackingPixel(campaignId: string, contactId: string): string {
    const pixelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/tracking/pixel?campaign=${campaignId}&contact=${contactId}&t=${Date.now()}`;
    return `<img src="${pixelUrl}" width="1" height="1" style="display:none;" />`;
  }

  private async processLinksForTracking(
    html: string,
    campaignId: string,
    contactId: string,
  ): Promise<string> {
    // Replace all href links with tracking URLs
    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/tracking/click`;
    return html.replace(/href="([^"]+)"/g, (match, url) => {
      const trackedUrl = `${trackingUrl}?campaign=${campaignId}&contact=${contactId}&url=${encodeURIComponent(url)}`;
      return `href="${trackedUrl}"`;
    });
  }

  private async recordSend(
    campaignId: string,
    contactId: string,
    accountId: string,
    messageId: string,
  ) {
    await supabase.from("campaign_sends").insert({
      campaign_id: campaignId,
      contact_id: contactId,
      account_id: accountId,
      message_id: messageId,
      status: "sent",
      sent_at: new Date().toISOString(),
    });
  }

  private async updateAccountStats(accountId: string) {
    const today = new Date().toISOString().split("T")[0];

    await supabase.from("account_daily_stats").upsert({
      account_id: accountId,
      date: today,
      sent_count: supabase.sql`sent_count + 1`,
    });
  }
}
