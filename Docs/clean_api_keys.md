# Clean Deduplicated API Keys - LifeOS

Generated from API Sheet.xlsx. Consolidated per your instructions.

**Nylas Policy**: Primary grant = cagednreality@icloud.com. Forward other email accounts to it.

**Meta Policy**: Use for lead sourcing from Facebook groups (Connections: I Have I Need etc.).

**AI Routing Recommendation** (no-cost first):
1. Groq + Gemini + Deepseek + Hugging Face (free tiers)
2. Local Qwen Desktop / Ollama
3. Me (Hermes) + Deepseek as strong no-cost options
4. Grok/xAI, Anthropic, OpenAI as paid fallbacks

| Category | Service | Key Name | Value (redacted in this view) | Account/Notes | Usage Notes |
|----------|---------|----------|------------------------------|---------------|-------------|
| Email & Comms | Nylas | NYLAS_API_KEY | nyk_v0_AbmPQP3B8PVDBxaSBV... | Main key | Primary + grants |
| Email & Comms | Nylas | NYLAS_GRANT_KEY (cagednreality@icloud.com) | f9c576ed-22b8-4891-8233-1... | cagednreality@icloud.com | USE THIS GRANT - forward other emails here |
| Social - Meta/Facebook (Lead Sourcing) | Meta | META_USER_ACCESS_TOKEN | EAALArDDLz70BR5qCpvbso9ZA... |  | For FB group lead sourcing |
| Social - Meta/Facebook (Lead Sourcing) | Meta | META_PAGE_ACCESS_TOKEN | EAALArDDLz70BR8H1DTqDEgZB... |  | Page access for leads |
| Social - Meta/Facebook (Lead Sourcing) | Meta | META_APP_SECRET | 9f940ccb81e37bbc2e81d9e3d... |  |  |
| Social - Meta/Facebook (Lead Sourcing) | Meta | META_CLIENT_ID | 890512880236960 |  |  |
| Social - Meta/Facebook (Lead Sourcing) | Meta | META_PAGE_ID | 104403705226192 |  |  |
| Infra - Cloudflare Workers | Cloudflare | CLOUDFLARE_API_TOKEN (1) | cfut_eO4XHBgDszF9WrzL20KM... |  | Keep unique tokens |
| Infra - Cloudflare Workers | Cloudflare | CLOUDFLARE_API_TOKEN (2) | cfut_8sm5QOvamkhf2kAJBu2z... |  |  |
| Infra - Cloudflare Workers | Cloudflare | CLOUDFLARE_ZONE_ID | 3fb469646957e2d3dee82c3c3... |  |  |
| Infra - Cloudflare Workers | Cloudflare | CLOUDFLARE_ACCOUNT_ID | 4cb5c0d8553b8c0c9156ee4f2... |  |  |
| Infra - Cloudflare Workers | Cloudflare | CLOUDFLARE_WORKER_URL | https://lifeos1.ceogps.wo... |  | Existing worker - reconfigure |
| Infra - Supabase | Supabase | SUPABASE_URL | https://mhvcdstgkyplhzjpt... |  | Review tables |
| Infra - Supabase | Supabase | SUPABASE_ANON_PUBLISHABLE_KEY | sb_publishable_tj21EW0eGM... |  | Client safe |
| Infra - Supabase | Supabase | SUPABASE_SERVICE_ROLE_KEY | sb_secret_tXlI8PjEuVJPwe6... |  | Worker only - secret |
| AI - Free Tier Preferred | Groq | GROQ_API_KEY | gsk_5eF0C7... (from sheet... |  | Strong free tier - primary |
| AI - Free Tier Preferred | Gemini | GEMINI_API_KEY | AIzaSyAyByRE5yf-iz3BmFKcN... |  | Excellent free tier |
| AI - Free Tier | Deepseek | DEEPSEEK_API_KEY | sk-a19... (from sheet) |  | User likes - no cost |
| AI - Free Tier | Hugging Face | HUGGINGFACE_API_KEY | hf_djYQLML... (from sheet... |  | Free inference |
| AI - Available | Grok/xAI | GROK_API_KEY / XAI_API_KEY | xai-IX3IBOom... (multiple... |  | You can use me (Hermes) + Qwen Desktop |
| AI - Fallback | Anthropic | ANTHROPIC_API_KEY | sk-ant-api03... (from she... |  |  |
| AI - Fallback | OpenAI | OPENAI_API_KEY | sk-proj-Tz... (from sheet... |  |  |
| Other Useful | Brevo | BREVO_API_KEY | xkeysib-8416ac88... (from... |  | Free transactional email |
| Other Useful | SendGrid | SENDGRID_API_KEY | SG.eWy... (from sheet) |  |  |
| Other Useful | Telegram Bot | TELEGRAM_BOT_TOKEN | AAH6PwAAlcrVa... (from sh... | @cagednreality_bot |  |
| Other Useful | Pocketbase | POCKETBASE_URL | https://pocketbase-lifeos... |  | Admin: chrisgr33ninc@gmail.com |
