// src/api/webhooks/zerobounce/routes.ts
// ZeroBounce webhook for email verification results

import { createRouter, jsonResponse, parseBody } from '../../router';
import { createWorkerSupabaseClient } from '@/lib/supabaseWorkerClient';

const router = createRouter();

// Helper to get supabase client from env
function getSupabase(env: any) {
  return createWorkerSupabaseClient(env);
}

// ZeroBounce webhook endpoint
router.post('/zerobounce', async (request, env) => {
  try {
    const supabase = getSupabase(env);
    // Verify webhook signature if configured
    const signature = request.headers.get('X-ZeroBounce-Signature');
    if (process.env.ZEROBOUNCE_WEBHOOK_SECRET && signature) {
      const isValid = await verifyZeroBounceSignature(request, signature);
      if (!isValid) {
        return jsonResponse({ error: 'Invalid signature' }, 401);
      }
    }

    const payload = await parseBody(request);

    // ZeroBounce sends results in various formats
    // Handle both single result and batch results
    const results = Array.isArray(payload) ? payload : [payload];

    for (const result of results) {
      const {
        email,
        status,
        sub_status,
        account,
        domain,
        did_you_mean,
        mx_found,
        mx_record,
        smtp_provider,
        free_email,
        disposable,
        toxic,
        firstname,
        lastname,
        gender,
        country,
        region,
        city,
        zipcode,
        processed_at,
      } = result;

      if (!email || !status) continue;

      // Map ZeroBounce status to our verification status
      let verificationStatus = 'unknown';
      switch (status) {
        case 'valid':
          verificationStatus = 'valid';
          break;
        case 'invalid':
          verificationStatus = 'invalid';
          break;
        case 'catch-all':
          verificationStatus = 'catch_all';
          break;
        case 'unknown':
          verificationStatus = 'unknown';
          break;
        case 'spamtrap':
          verificationStatus = 'spamtrap';
          break;
        case 'abuse':
          verificationStatus = 'abuse';
          break;
        case 'do_not_mail':
          verificationStatus = 'invalid';
          break;
      }

      // Update contact verification status
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          verification_status: verificationStatus,
          verification_sub_status: sub_status,
          verification_details: {
            account,
            domain,
            did_you_mean,
            mx_found,
            mx_record,
            smtp_provider,
            free_email,
            disposable,
            toxic,
            firstname,
            lastname,
            gender,
            country,
            region,
            city,
            zipcode,
            processed_at,
          },
          verified_at: new Date().toISOString(),
        })
        .eq('email', email);

      if (updateError) {
        console.error(`Failed to update contact ${email}:`, updateError);
      }

      // Log verification event
      await supabase.from('verification_logs').insert({
        email,
        status: verificationStatus,
        sub_status,
        provider: 'zerobounce',
        raw_response: result,
        created_at: new Date().toISOString(),
      });
    }

    return jsonResponse({ received: true, processed: results.length });
  } catch (error: any) {
    console.error('ZeroBounce webhook error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
});

// Verify ZeroBounce webhook signature
async function verifyZeroBounceSignature(request: Request, signature: string): Promise<boolean> {
  const secret = process.env.ZEROBOUNCE_WEBHOOK_SECRET;
  if (!secret) return true; // Skip verification if no secret configured

  try {
    const body = await request.text();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );

    const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const expectedHex = Array.from(new Uint8Array(expectedSignature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return signature === expectedHex;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Endpoint to trigger verification for a contact
router.post('/verify', async (request, env) => {
  try {
    const supabase = getSupabase(env);
    const { email, contactId } = await parseBody(request);

    if (!email) {
      return jsonResponse({ error: 'Email is required' }, 400);
    }

    // Call ZeroBounce API to verify email
    const apiKey = process.env.ZEROBOUNCE_API_KEY;
    if (!apiKey) {
      return jsonResponse({ error: 'ZeroBounce API key not configured' }, 500);
    }

    const response = await fetch(
      `https://api.zerobounce.net/v2/validate?api_key=${apiKey}&email=${encodeURIComponent(email)}`
    );

    const result = await response.json();

    // Update contact with verification result
    if (contactId) {
      let verificationStatus = 'unknown';
      switch (result.status) {
        case 'valid':
          verificationStatus = 'valid';
          break;
        case 'invalid':
          verificationStatus = 'invalid';
          break;
        case 'catch-all':
          verificationStatus = 'catch_all';
          break;
        case 'unknown':
          verificationStatus = 'unknown';
          break;
        case 'spamtrap':
          verificationStatus = 'spamtrap';
          break;
        case 'abuse':
          verificationStatus = 'abuse';
          break;
        case 'do_not_mail':
          verificationStatus = 'invalid';
          break;
      }

      await supabase
        .from('contacts')
        .update({
          verification_status: verificationStatus,
          verification_sub_status: result.sub_status,
          verification_details: result,
          verified_at: new Date().toISOString(),
        })
        .eq('id', contactId);
    }

    return jsonResponse({ success: true, result });
  } catch (error: any) {
    console.error('Verification trigger error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
});

// Batch verification endpoint
router.post('/verify/batch', async (request, env) => {
  try {
    const supabase = getSupabase(env);
    const { emails } = await parseBody(request);

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return jsonResponse({ error: 'Emails array is required' }, 400);
    }

    const apiKey = process.env.ZEROBOUNCE_API_KEY;
    if (!apiKey) {
      return jsonResponse({ error: 'ZeroBounce API key not configured' }, 500);
    }

    // ZeroBounce batch API
    const response = await fetch('https://bulkapi.zerobounce.net/v2/validatebatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        email_batch: emails.map((email) => ({ email_address: email })),
      }),
    });

    const result = await response.json();

    return jsonResponse({ success: true, file_id: result.file_id, message: result.message });
  } catch (error: any) {
    console.error('Batch verification error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
});

// Check batch verification status
router.get('/verify/batch/:fileId/status', async (request, env) => {
  try {
    const supabase = getSupabase(env);
    const fileId = request.url.split('/').pop();
    const apiKey = process.env.ZEROBOUNCE_API_KEY;

    if (!apiKey || !fileId) {
      return jsonResponse({ error: 'Missing parameters' }, 400);
    }

    const response = await fetch(
      `https://bulkapi.zerobounce.net/v2/filestatus?api_key=${apiKey}&file_id=${fileId}`
    );

    const result = await response.json();

    // If complete, download and process results
    if (result.file_status === 'Complete' && result.download_url) {
      const downloadResponse = await fetch(result.download_url);
      const csvText = await downloadResponse.text();

      // Parse CSV and update contacts
      const lines = csvText.split('\n').slice(1); // Skip header
      for (const line of lines) {
        if (!line.trim()) continue;
        const [
          email,
          status,
          sub_status,
          account,
          domain,
          did_you_mean,
          mx_found,
          mx_record,
          smtp_provider,
          free_email,
          disposable,
          toxic,
        ] = line.split(',');

        // Update contact (similar to webhook handler)
        await supabase
          .from('contacts')
          .update({
            verification_status: mapStatus(status),
            verification_sub_status: sub_status,
            verified_at: new Date().toISOString(),
          })
          .eq('email', email.replace(/"/g, ''));
      }
    }

    return jsonResponse({ success: true, status: result.file_status, complete_percentage: result.complete_percentage });
  } catch (error: any) {
    console.error('Batch status check error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
});

function mapStatus(status: string): string {
  switch (status?.toLowerCase()) {
    case 'valid':
      return 'valid';
    case 'invalid':
      return 'invalid';
    case 'catch-all':
      return 'catch_all';
    case 'unknown':
      return 'unknown';
    case 'spamtrap':
      return 'spamtrap';
    case 'abuse':
      return 'abuse';
    case 'do_not_mail':
      return 'invalid';
    default:
      return 'unknown';
  }
}

export default router;