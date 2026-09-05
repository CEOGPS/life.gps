// src/api/webhooks/routes.ts
// General webhook routes for various services

import { createRouter, jsonResponse, parseBody } from '../router';
import { createWorkerSupabaseClient } from '@/lib/supabaseWorkerClient';

const router = createRouter();

// Helper to get supabase client from env
function getSupabase(env: any) {
  return createWorkerSupabaseClient(env);
}

// SendGrid webhook (also accessible via /api/email/send/webhook/sendgrid)
router.post('/sendgrid', async (request, env) => {
  try {
    const supabase = getSupabase(env);
    const events = await parseBody(request);

    for (const event of events) {
      const messageId = event.sg_message_id;
      const eventType = event.event;

      const { data: send } = await supabase
        .from('campaign_sends')
        .select('id')
        .eq('message_id', messageId)
        .single();

      if (send) {
        await supabase.from('email_events').insert({
          send_id: send.id,
          event_type: eventType,
          event_data: event,
          created_at: new Date(event.timestamp * 1000).toISOString(),
        });

        let status = null;
        if (eventType === 'delivered') status = 'delivered';
        if (eventType === 'open') status = 'opened';
        if (eventType === 'click') status = 'clicked';
        if (eventType === 'bounce') status = 'bounced';
        if (eventType === 'spamreport') status = 'spam';
        if (eventType === 'unsubscribe') status = 'unsubscribed';

        if (status) {
          await supabase
            .from('campaign_sends')
            .update({ status })
            .eq('id', send.id);
        }
      }
    }

    return jsonResponse({ received: true });
  } catch (error: any) {
    console.error('SendGrid webhook error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
});

// Brevo (Sendinblue) webhook
router.post('/brevo', async (request, env) => {
  try {
    const supabase = getSupabase(env);
    const event = await parseBody(request);
    const messageId = event['message-id'] || event.messageId;
    const eventType = event.event;

    const { data: send } = await supabase
      .from('campaign_sends')
      .select('id')
      .eq('message_id', messageId)
      .single();

    if (send) {
      await supabase.from('email_events').insert({
        send_id: send.id,
        event_type: eventType,
        event_data: event,
        created_at: new Date().toISOString(),
      });

      let status = null;
      if (eventType === 'delivered') status = 'delivered';
      if (eventType === 'opened') status = 'opened';
      if (eventType === 'clicked') status = 'clicked';
      if (eventType === 'hard_bounce' || eventType === 'soft_bounce') status = 'bounced';
      if (eventType === 'complaint') status = 'spam';
      if (eventType === 'unsubscribed') status = 'unsubscribed';

      if (status) {
        await supabase
          .from('campaign_sends')
          .update({ status })
          .eq('id', send.id);
      }
    }

    return jsonResponse({ received: true });
  } catch (error: any) {
    console.error('Brevo webhook error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
});

// Mailgun webhook
router.post('/mailgun', async (request, env) => {
  try {
    const supabase = getSupabase(env);
    const event = await parseBody(request);
    const messageId = event['Message-Id'] || event.messageId;
    const eventType = event.event;

    const { data: send } = await supabase
      .from('campaign_sends')
      .select('id')
      .eq('message_id', messageId)
      .single();

    if (send) {
      await supabase.from('email_events').insert({
        send_id: send.id,
        event_type: eventType,
        event_data: event,
        created_at: new Date(event.timestamp * 1000).toISOString(),
      });

      let status = null;
      if (eventType === 'delivered') status = 'delivered';
      if (eventType === 'opened') status = 'opened';
      if (eventType === 'clicked') status = 'clicked';
      if (eventType === 'bounced') status = 'bounced';
      if (eventType === 'complained') status = 'spam';
      if (eventType === 'unsubscribed') status = 'unsubscribed';

      if (status) {
        await supabase
          .from('campaign_sends')
          .update({ status })
          .eq('id', send.id);
      }
    }

    return jsonResponse({ received: true });
  } catch (error: any) {
    console.error('Mailgun webhook error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
});

// Postmark webhook
router.post('/postmark', async (request, env) => {
  try {
    const supabase = getSupabase(env);
    const event = await parseBody(request);
    const messageId = event.MessageID;
    const eventType = event.RecordType;

    const { data: send } = await supabase
      .from('campaign_sends')
      .select('id')
      .eq('message_id', messageId)
      .single();

    if (send) {
      await supabase.from('email_events').insert({
        send_id: send.id,
        event_type: eventType,
        event_data: event,
        created_at: new Date().toISOString(),
      });

      let status = null;
      if (eventType === 'Delivery') status = 'delivered';
      if (eventType === 'Open') status = 'opened';
      if (eventType === 'Click') status = 'clicked';
      if (eventType === 'Bounce') status = 'bounced';
      if (eventType === 'SpamComplaint') status = 'spam';
      if (eventType === 'Unsubscribe') status = 'unsubscribed';

      if (status) {
        await supabase
          .from('campaign_sends')
          .update({ status })
          .eq('id', send.id);
      }
    }

    return jsonResponse({ received: true });
  } catch (error: any) {
    console.error('Postmark webhook error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
});

// Generic webhook handler (for custom integrations)
router.post('/generic', async (request, env) => {
  try {
    const supabase = getSupabase(env);
    const payload = await parseBody(request);
    const { source, event_type, data } = payload;

    if (!source || !event_type) {
      return jsonResponse({ error: 'Missing source or event_type' }, 400);
    }

    // Log the webhook
    await supabase.from('webhook_logs').insert({
      source,
      event_type,
      payload: data,
      received_at: new Date().toISOString(),
    });

    return jsonResponse({ received: true, source, event_type });
  } catch (error: any) {
    console.error('Generic webhook error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
});

export default router;