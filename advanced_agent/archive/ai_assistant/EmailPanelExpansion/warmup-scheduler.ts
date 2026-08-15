// lib/warmup-scheduler.ts
import { supabase } from "./supabase";
import { EmailSender } from "./octomailer-client";

export class WarmupScheduler {
  private emailSender: EmailSender;

  constructor() {
    this.emailSender = new EmailSender();
  }

  async runDailyWarmup() {
    // Get all accounts in warmup mode
    const { data: accounts } = await supabase
      .from("email_accounts")
      .select(
        `
        *,
        account_warmup (*),
        warmup_plans (*)
      `,
      )
      .eq("warmup_status", "warming")
      .eq("is_active", true);

    for (const account of accounts || []) {
      await this.processAccountWarmup(account);
    }
  }

  private async processAccountWarmup(account: any) {
    const warmup = account.account_warmup;
    const plan = account.warmup_plans;

    if (!warmup || !plan) return;

    // Calculate today's target based on progression
    const progress = warmup.current_day / plan.duration_days;
    const todayTarget = Math.floor(
      plan.daily_start + (plan.daily_max - plan.daily_start) * progress,
    );

    // Get today's sent count
    const { data: todayStats } = await supabase
      .from("account_daily_stats")
      .select("sent_count")
      .eq("account_id", account.id)
      .eq("date", new Date().toISOString().split("T")[0])
      .single();

    const sentToday = todayStats?.sent_count || 0;
    const remainingToSend = todayTarget - sentToday;

    if (remainingToSend <= 0) {
      // Check if warmup is complete
      if (warmup.current_day >= plan.duration_days) {
        await this.completeWarmup(account.id);
      }
      return;
    }

    // Send warmup emails to a pool of trusted addresses
    await this.sendWarmupEmails(account, remainingToSend);

    // Update warmup progress
    await supabase
      .from("account_warmup")
      .update({
        current_day: warmup.current_day + 1,
        today_target: todayTarget,
      })
      .eq("account_id", account.id);
  }

  private async sendWarmupEmails(account: any, count: number) {
    // Get warmup pool addresses from your warmup network
    const warmupPool = await this.getWarmupPool();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const warmupContact = warmupPool[i % warmupPool.length];

      await this.emailSender.sendCampaignEmail(
        "warmup_campaign",
        warmupContact,
        account,
        {
          subject: "Warmup email",
          html: "<p>Warmup content</p>",
          text: "Warmup content",
        },
      );

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 60000)); // 1 email per minute
    }
  }

  private async getWarmupPool(): Promise<any[]> {
    // Fetch from your warmup network or use pre-defined trusted addresses
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("verification_status", "valid")
      .eq("category", "customer")
      .limit(50);

    return data || [];
  }

  private async completeWarmup(accountId: string) {
    await supabase
      .from("email_accounts")
      .update({
        warmup_status: "warm",
        warmup_progress: 100,
      })
      .eq("id", accountId);
  }
}

// Edge function to run daily
export const warmupSchedulerHandler = async (req: Request) => {
  const scheduler = new WarmupScheduler();
  await scheduler.runDailyWarmup();

  return new Response("Warmup completed", { status: 200 });
};
