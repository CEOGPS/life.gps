// src/api/cron/routes.ts
// Cron job endpoints for scheduled tasks

import { createRouter, jsonResponse, parseBody } from '../router';
import { createWorkerSupabaseClient } from '@/lib/supabaseWorkerClient';

const router = createRouter();

// Helper to get supabase client from env
function getSupabase(env: any) {
  return createWorkerSupabaseClient(env);
}

// Secret verification middleware for cron jobs
const verifyCronSecret = (request: Request) => {
  const cronSecret = request.headers.get('Authorization')?.replace('Bearer ', '');
  const expectedSecret = process.env.CRON_SECRET || 'your-cron-secret-here';
  return cronSecret === expectedSecret;
};

// Daily warmup scheduler
router.post('/warmup/daily', async (request, env) => {
  if (!verifyCronSecret(request)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const supabase = getSupabase(env);
    // Get all accounts in warmup mode
    const { data: accounts, error } = await supabase
      .from('email_accounts')
      .select(`
        *,
        account_warmup (*),
        warmup_plans (*)
      `)
      .eq('warmup_status', 'warming')
      .eq('is_active', true);

    if (error) throw error;

    let processed = 0;
    for (const account of accounts || []) {
      await processAccountWarmup(account, supabase);
      processed++;
    }

    return jsonResponse({
      success: true,
      processed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Daily warmup error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
});

// Hourly email sync
router.post('/email/sync', async (request, env) => {
  if (!verifyCronSecret(request)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const supabase = getSupabase(env);
    const { data: accounts } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('is_active', true)
      .eq('sync_enabled', true);

    let synced = 0;
    for (const account of accounts || []) {
      await syncAccountEmails(account.id, supabase);
      synced++;
    }

    return jsonResponse({
      success: true,
      synced,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Email sync error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
});

// Daily campaign stats aggregation
router.post('/campaigns/aggregate', async (request, env) => {
  if (!verifyCronSecret(request)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const supabase = getSupabase(env);
    const today = new Date().toISOString().split('T')[0];

    // Aggregate campaign stats for today
    const { data: sends, error } = await supabase
      .from('campaign_sends')
      .select('campaign_id, status')
      .gte('sent_at', `${today}T00:00:00.000Z`)
      .lt('sent_at', `${today}T23:59:59.999Z`);

    if (error) throw error;

    // Update campaign daily stats
    const statsByCampaign: Record<string, any> = {};
    for (const send of sends || []) {
      if (!statsByCampaign[send.campaign_id]) {
        statsByCampaign[send.campaign_id] = {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          spam: 0,
        };
      }
      statsByCampaign[send.campaign_id].sent++;
      if (send.status === 'delivered') statsByCampaign[send.campaign_id].delivered++;
      if (send.status === 'opened') statsByCampaign[send.campaign_id].opened++;
      if (send.status === 'clicked') statsByCampaign[send.campaign_id].clicked++;
      if (send.status === 'bounced') statsByCampaign[send.campaign_id].bounced++;
      if (send.status === 'spam') statsByCampaign[send.campaign_id].spam++;
    }

    // Upsert daily stats
    for (const [campaignId, stats] of Object.entries(statsByCampaign)) {
      await supabase.from('campaign_daily_stats').upsert({
        campaign_id: campaignId,
        date: today,
        ...stats,
      });
    }

    return jsonResponse({
      success: true,
      campaignsUpdated: Object.keys(statsByCampaign).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Campaign aggregation error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
});

// Weekly contact verification
router.post('/contacts/verify/weekly', async (request, env) => {
  if (!verifyCronSecret(request)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const supabase = getSupabase(env);
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, email')
      .eq('verification_status', 'pending')
      .limit(1000);

    let verified = 0;
    for (const contact of contacts || []) {
      // Call verification API (would integrate with ZeroBounce or similar)
      await verifyContactEmail(contact.email, contact.id, supabase);
      verified++;
    }

    return jsonResponse({
      success: true,
      verified,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Weekly verification error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
});

// Helper functions
async function processAccountWarmup(account: any, supabase: any) {
  const warmup = account.account_warmup;
  const plan = account.warmup_plans;

  if (!warmup || !plan) return;

  const progress = warmup.current_day / plan.duration_days;
  const todayTarget = Math.floor(
    plan.daily_start + (plan.daily_max - plan.daily_start) * progress
  );

  const { data: todayStats } = await supabase
    .from('account_daily_stats')
    .select('sent_count')
    .eq('account_id', account.id)
    .eq('date', new Date().toISOString().split('T')[0])
    .single();

  const sentToday = todayStats?.sent_count || 0;
  const remainingToSend = todayTarget - sentToday;

  if (remainingToSend <= 0) {
    if (warmup.current_day >= plan.duration_days) {
      await completeWarmup(account.id, supabase);
    }
    return;
  }

  // Send warmup emails (placeholder - integrate with email sender)
  await sendWarmupEmails(account, remainingToSend);

  await supabase
    .from('account_warmup')
    .update({
      current_day: warmup.current_day + 1,
      today_target: todayTarget,
    })
    .eq('account_id', account.id);
}

async function syncAccountEmails(accountId: string, supabase: any) {
  // This would call the EmailSyncWorker
  // Placeholder for actual implementation
}

async function completeWarmup(accountId: string, supabase: any) {
  await supabase
    .from('email_accounts')
    .update({
      warmup_status: 'warm',
      warmup_progress: 100,
    })
    .eq('id', accountId);
}

async function sendWarmupEmails(account: any, count: number) {
  // Placeholder for warmup email sending
}

async function verifyContactEmail(email: string, contactId: string, supabase: any) {
  // Placeholder for email verification
  // Would integrate with ZeroBounce, NeverBounce, etc.
}

export default router;