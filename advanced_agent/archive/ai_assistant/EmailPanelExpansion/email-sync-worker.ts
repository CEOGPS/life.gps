// lib/email-sync-worker.ts
import { supabase } from "./supabase";
import { google } from "googleapis";
import { Client } from "@microsoft/microsoft-graph-client";

export class EmailSyncWorker {
  private accountId: string;
  private accessToken: string;
  private provider: string;

  constructor(accountId: string, accessToken: string, provider: string) {
    this.accountId = accountId;
    this.accessToken = accessToken;
    this.provider = provider;
  }

  async syncEmails() {
    try {
      // Update sync state
      await this.updateSyncState("syncing");

      if (this.provider === "gmail" || this.provider === "google_workspace") {
        await this.syncGmail();
      } else if (this.provider === "outlook") {
        await this.syncOutlook();
      }

      await this.updateSyncState("completed");
    } catch (error) {
      console.error("Sync failed:", error);
      await this.updateSyncState("failed", error.message);
    }
  }

  private async syncGmail() {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: this.accessToken });

    const gmail = google.gmail({ version: "v1", auth });

    // Get last sync state
    const { data: syncState } = await supabase
      .from("email_sync_state")
      .select("last_history_id")
      .eq("account_id", this.accountId)
      .single();

    // Fetch new messages using history API
    const response = await gmail.users.history.list({
      userId: "me",
      startHistoryId: syncState?.last_history_id,
      maxResults: 100,
    });

    const history = response.data.history || [];

    for (const record of history) {
      const messages = record.messages || [];
      for (const message of messages) {
        await this.processGmailMessage(gmail, message.id!);
      }
    }

    // Update last history ID
    if (response.data.historyId) {
      await supabase.from("email_sync_state").upsert({
        account_id: this.accountId,
        last_history_id: response.data.historyId,
        last_sync_at: new Date().toISOString(),
      });
    }
  }

  private async processGmailMessage(gmail: any, messageId: string) {
    const message = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "metadata",
      metadataHeaders: ["From", "To", "Subject", "Date"],
    });

    const headers = message.data.payload?.headers || [];
    const from = headers.find((h: any) => h.name === "From")?.value || "";
    const to = headers.find((h: any) => h.name === "To")?.value || "";
    const subject = headers.find((h: any) => h.name === "Subject")?.value || "";

    // Extract email addresses
    const fromEmail = this.extractEmail(from);
    const toEmail = this.extractEmail(to);

    // Update contact based on email interaction
    if (fromEmail && toEmail !== "me") {
      await this.updateContactInteraction(fromEmail, {
        last_contacted_at: new Date().toISOString(),
        source: "email_sync",
      });
    }
  }

  private async syncOutlook() {
    const client = Client.init({
      authProvider: (done) => {
        done(null, this.accessToken);
      },
    });

    const messages = await client
      .api("/me/messages")
      .select("from,toRecipients,subject,receivedDateTime")
      .top(100)
      .get();

    for (const message of messages.value) {
      const fromEmail = message.from?.emailAddress?.address;
      if (fromEmail) {
        await this.updateContactInteraction(fromEmail, {
          last_contacted_at: message.receivedDateTime,
          source: "email_sync",
        });
      }
    }
  }

  private extractEmail(headerValue: string): string | null {
    const match = headerValue.match(
      /<(.+?)>|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
    );
    return match ? match[1] || match[2] : null;
  }

  private async updateContactInteraction(email: string, data: any) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    await supabase
      .from("contacts")
      .update(data)
      .eq("user_id", user.user.id)
      .eq("email", email);
  }

  private async updateSyncState(status: string, error?: string) {
    await supabase.from("email_sync_state").upsert({
      account_id: this.accountId,
      sync_status: status,
      error_message: error,
      last_sync_at: new Date().toISOString(),
    });
  }
}

// Edge function to trigger sync
export const syncAccountEmails = async (accountId: string) => {
  const { data: account } = await supabase
    .from("email_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (!account) throw new Error("Account not found");

  const worker = new EmailSyncWorker(
    account.id,
    account.access_token!,
    account.provider,
  );

  await worker.syncEmails();
};
